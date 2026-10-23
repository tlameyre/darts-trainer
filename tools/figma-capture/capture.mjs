// Captures every screen of the running app as a static HTML snapshot and groups
// them into one gallery page per section, ready for a single html.to.design capture.
// Usage: TEST_EMAIL=… TEST_PASSWORD=… node capture.mjs <outDir>
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const BASE = 'http://localhost:5173/darts-trainer';
const OUT = process.argv[2];
const VIEWPORT = { width: 390, height: 844 };

const SECTIONS = {
  auth: 'Connexion', home: 'Accueil', play: 'Jouer · Calcul · Échauffement', x01: '501',
  checkout: 'Checkouts', tactics: 'Tactics', tournament: 'Tournoi', stats: 'Stats', profile: 'Profil',
};

const shots = [];
let css = '';
const seen = new Set();

const settle = (page, ms = 700) => page.waitForLoadState('networkidle').then(() => page.waitForTimeout(ms));
const go = async (page, route) => { await page.goto(BASE + route); await settle(page); };
const click = async (page, name) => {
  await page.getByRole('button', { name }).first().click();
  await settle(page);
};
const clickIn = async (page, name) => {
  await page.locator('.dev__fullscreen-preview').getByRole('button', { name }).first().click();
  await settle(page);
};
const dev = async (page, label) => {
  await go(page, '/dev');
  await page.getByRole('button', { name: label, exact: true }).click();
  await settle(page);
};

// Freezes a copy of the current DOM (the live one stays intact for the next steps):
// inlines <use> icons, form values, drops scripts.
// `isolate` keeps only one subtree (the /dev fullscreen previews).
async function snap(page, section, title, isolate = null) {
  const data = await page.evaluate((sel) => {
    const live = sel ? document.querySelector(sel) : document.getElementById('app');
    const copy = live.cloneNode(true);
    const liveFields = live.querySelectorAll('input, textarea');
    copy.querySelectorAll('input, textarea').forEach((i, n) => {
      const src = liveFields[n];
      if (i.tagName === 'TEXTAREA') i.textContent = src.value;
      else i.setAttribute('value', src.value);
      if (src.checked) i.setAttribute('checked', '');
    });
    copy.querySelectorAll('svg use').forEach((u) => {
      const id = (u.getAttribute('href') || u.getAttribute('xlink:href') || '').slice(1);
      const sym = document.getElementById(id);
      if (!sym) return;
      const svg = u.closest('svg');
      if (!svg.getAttribute('viewBox') && sym.getAttribute('viewBox')) svg.setAttribute('viewBox', sym.getAttribute('viewBox'));
      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.innerHTML = sym.innerHTML;
      u.replaceWith(g);
    });
    copy.querySelectorAll('svg symbol').forEach((s) => s.closest('svg')?.remove());
    copy.querySelectorAll('script, noscript, .dev__close-preview').forEach((s) => s.remove());
    // Media queries are resolved now, against the phone viewport, so the gallery's width can't flip them
    const flatten = (list) => [...list].flatMap((r) => {
      if (r instanceof CSSMediaRule) return matchMedia(r.conditionText || r.media.mediaText).matches ? flatten(r.cssRules) : [];
      return [r.cssText];
    });
    const rules = [...document.styleSheets].flatMap((s) => {
      try { return flatten(s.cssRules); } catch { return []; }
    });
    if (sel) {
      copy.style.position = 'relative';
      copy.style.inset = 'auto';
    }
    return { rules, html: copy.outerHTML, height: Math.max(844, live.scrollHeight, sel ? 0 : document.documentElement.scrollHeight) };
  }, isolate);
  for (const r of data.rules) if (!seen.has(r)) { seen.add(r); css += r + '\n'; }
  shots.push({ section, title, ...data });
  console.log(`✓ ${section} — ${title}`);
}

// Viewport units would resolve against the gallery page; pin them to the phone frame instead.
const freezeCss = (rules) => rules
  .replace(/@font-face\s*\{[^}]*\}/g, '')
  .replace(/100(dvh|svh|lvh|vh)/g, 'var(--frame-h, 844px)');

const FONT_LINK = '<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&display=swap" rel="stylesheet">';
const FRAME_CSS = `
.gallery{display:flex;flex-wrap:wrap;align-items:flex-start;gap:80px;padding:80px;background:#0b0f0e;min-height:auto}
.gallery__frame{display:flex;flex-direction:column;gap:16px}
.gallery__label{margin:0;color:rgba(255,255,255,.6);font:600 18px Outfit,sans-serif}
.gallery__screen{position:relative;width:390px;overflow:hidden;background:#121A18;transform:translateZ(0);--frame-h:844px}`;

const doc = (title, body) => `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
${FONT_LINK}
<style>${freezeCss(css)}${FRAME_CSS}</style>
</head>
<body style="margin:0;background:#0b0f0e">
${body}
</body>
</html>
`;

const frame = (s) => `<section class="gallery__frame"><h2 class="gallery__label">${s.title}</h2>`
  + `<div class="gallery__screen" style="height:${s.height}px">${s.html}</div></section>`;

async function main() {
  const browser = await chromium.launch();
  const opts = { viewport: VIEWPORT, deviceScaleFactor: 2, locale: 'fr-FR' };

  // ── Logged out ───────────────────────────────────────────────
  const anon = await (await browser.newContext(opts)).newPage();
  await go(anon, '/login'); await snap(anon, 'auth', 'Connexion');
  await go(anon, '/register'); await snap(anon, 'auth', 'Inscription');

  // ── Logged in ────────────────────────────────────────────────
  const page = await (await browser.newContext(opts)).newPage();
  await go(page, '/login');
  await page.locator('input[type=email]').fill(process.env.TEST_EMAIL);
  await page.locator('input[type=password]').fill(process.env.TEST_PASSWORD);
  await page.getByRole('button', { name: /se connecter/i }).click();
  await page.waitForURL((u) => !u.pathname.endsWith('/login'));
  await settle(page, 1200);

  await go(page, '/'); await snap(page, 'home', 'Accueil');

  await go(page, '/play'); await snap(page, 'play', 'Jouer');
  await go(page, '/score-training'); await snap(page, 'play', 'Calcul — réglages');
  await click(page, /^jouer$/i); await snap(page, 'play', 'Calcul — partie');
  await go(page, '/warmup'); await snap(page, 'play', 'Échauffement — réglages');
  await click(page, /^commencer$/i); await snap(page, 'play', 'Échauffement — session');

  await go(page, '/501'); await snap(page, 'x01', '501 — réglages');
  await click(page, /^commencer$/i); await snap(page, 'x01', '501 — partie solo');
  await dev(page, 'Match tournoi (bouton "Retour au bracket")'); await snap(page, 'x01', '501 — partie 2 joueurs');
  await go(page, '/501/online'); await snap(page, 'x01', '501 en ligne — défi');
  await dev(page, 'Invitation envoyée (hôte)'); await snap(page, 'x01', 'Match en ligne — invitation envoyée', '.dev__fullscreen-preview');
  await dev(page, 'Invitation reçue (invité)'); await snap(page, 'x01', 'Match en ligne — invitation reçue', '.dev__fullscreen-preview');
  await dev(page, 'Bull — choix du premier joueur (hôte)'); await snap(page, 'x01', 'Match en ligne — qui commence', '.dev__fullscreen-preview');

  await go(page, '/checkouts'); await snap(page, 'checkout', 'Checkouts — réglages');
  await click(page, /^commencer$/i); await snap(page, 'checkout', 'Checkouts — révision libre');
  await go(page, '/checkouts'); await click(page, /quiz noté/i); await click(page, /^commencer$/i);
  await snap(page, 'checkout', 'Checkouts — quiz noté');
  await go(page, '/checkouts/wiki'); await snap(page, 'checkout', 'Checkouts — consulter');
  await go(page, '/checkouts/wiki/100'); await snap(page, 'checkout', 'Checkout — détail (100)');

  await go(page, '/tactics'); await snap(page, 'tactics', 'Tactics — réglages');
  await click(page, /^commencer$/i); await snap(page, 'tactics', 'Tactics — partie solo');
  await dev(page, 'Partie Tactics — 2 joueurs'); await snap(page, 'tactics', 'Tactics — partie 2 joueurs');

  await go(page, '/tournaments'); await snap(page, 'tournament', 'Tournois — liste');
  await go(page, '/tournaments/create'); await snap(page, 'tournament', 'Création — étape 1');
  await click(page, /^suivant$/i); await snap(page, 'tournament', 'Création — étape 2');
  await dev(page, 'Page "Rejoindre par code"'); await snap(page, 'tournament', 'Rejoindre par code', '.dev__fullscreen-preview');
  await dev(page, 'Tournoi pas démarré (Infos/Participants)');
  await snap(page, 'tournament', 'Tournoi — infos', '.dev__fullscreen-preview');
  await dev(page, 'Tournoi pas démarré (Infos/Participants)'); await clickIn(page, /^participants$/i);
  await snap(page, 'tournament', 'Tournoi — participants', '.dev__fullscreen-preview');
  await dev(page, 'Bracket 5 joueurs (avec byes)'); await clickIn(page, /^bracket$/i);
  await snap(page, 'tournament', 'Tournoi — bracket', '.dev__fullscreen-preview');
  await dev(page, 'Championnat 4 joueurs aller-retour + finale'); await clickIn(page, /^classement$/i);
  await snap(page, 'tournament', 'Championnat — classement', '.dev__fullscreen-preview');
  await dev(page, 'Championnat 4 joueurs aller-retour + finale'); await clickIn(page, /^journées$/i);
  await snap(page, 'tournament', 'Championnat — journées', '.dev__fullscreen-preview');
  await dev(page, 'Championnat 4 joueurs aller-retour + finale'); await clickIn(page, /^stats$/i);
  await snap(page, 'tournament', 'Championnat — stats joueurs', '.dev__fullscreen-preview');

  for (const tab of ['Quiz', 'Echauffement', 'X01', 'Checkouts']) {
    await go(page, '/stats'); await click(page, new RegExp(`^${tab}$`, 'i'));
    await snap(page, 'stats', `Stats — ${tab}`);
  }
  await dev(page, 'Ouvrir la vue Détail échauffement'); await snap(page, 'stats', 'Détail échauffement', '.dev__fullscreen-preview');
  await dev(page, 'Ouvrir le détail (badge → championnat fictif)'); await snap(page, 'stats', 'Détail match X01', '.session-detail');

  await go(page, '/profile'); await snap(page, 'profile', 'Profil');
  await go(page, '/profile/edit'); await snap(page, 'profile', 'Modifier le profil');
  await go(page, '/profile/badges'); await snap(page, 'profile', 'Badges');
  await go(page, '/friends'); await snap(page, 'profile', 'Amis');

  await browser.close();

  // ── Write gallery pages + individual screens ────────────────
  fs.mkdirSync(path.join(OUT, 'screens'), { recursive: true });
  const slug = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase();
  const links = [];
  for (const [id, name] of Object.entries(SECTIONS)) {
    const list = shots.filter((s) => s.section === id);
    if (!list.length) continue;
    fs.writeFileSync(path.join(OUT, `page-${id}.html`), doc(`Darts Trainer — ${name}`, `<main class="gallery">${list.map(frame).join('')}</main>`));
    for (const s of list) fs.writeFileSync(path.join(OUT, 'screens', `${id}-${slug(s.title)}.html`), doc(s.title, `<main class="gallery">${frame(s)}</main>`));
    links.push(`<li><a href="page-${id}.html">${name}</a> — ${list.length} écrans</li>`);
  }
  fs.writeFileSync(path.join(OUT, 'index.html'), doc('Darts Trainer — captures', `<main style="padding:40px;color:#fff;font-family:Outfit"><h1>Darts Trainer — captures de l'app</h1><ul>${links.join('')}</ul></main>`));
  console.log(`${shots.length} écrans → ${OUT}`);
}

main().catch((e) => { console.error(e); process.exit(1); });

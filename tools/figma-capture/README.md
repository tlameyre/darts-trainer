# figma-capture

Captures every screen of the running app (mobile 390×844) as static HTML, grouped into one
gallery page per section, to import into Figma with the html.to.design Chrome extension.

```bash
cd tools/figma-capture
npm install && npx playwright install chromium
# dev server must run on :5173 (npm run dev at the repo root)
TEST_EMAIL=… TEST_PASSWORD=… npm run capture
```

Output: `figma-export/app/page-*.html` (one gallery per section) and `figma-export/app/screens/`.
Open a page in Chrome, capture it with html.to.design, import the `.h2d` file with the Figma plugin.

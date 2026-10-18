-- ============================================================
-- DARTS TRAINER — Supabase schema
-- Exécuter dans : Supabase Dashboard > SQL Editor
-- ============================================================

-- 1. Profiles (1 par utilisateur)
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  first_name  text,
  last_name   text,
  username    text,
  friend_code text unique,
  settings    jsonb default '{}'::jsonb,
  created_at  timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Lecture du propre profil"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Insertion du propre profil"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Mise à jour du propre profil"
  on public.profiles for update
  using (auth.uid() = id);

-- Lecture partielle pour la recherche par friend_code (ajout d'amis)
create policy "Lecture publique par friend_code"
  on public.profiles for select
  using (true);

-- Créer automatiquement un profil à l'inscription
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
declare
  new_code text;
  code_exists boolean;
begin
  -- Génère un friend_code unique au format DMC-XXXX
  loop
    new_code := 'DMC-' || substring(md5(random()::text) from 1 for 4);
    new_code := upper(new_code);
    select exists(select 1 from public.profiles where friend_code = new_code) into code_exists;
    exit when not code_exists;
  end loop;

  insert into public.profiles (id, username, friend_code)
  values (new.id, new.raw_user_meta_data->>'username', new_code)
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- 2. Badges utilisateur
create table public.user_badges (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade not null,
  badge_id    text not null,
  unlocked_at timestamptz default now(),
  unique(user_id, badge_id)
);

alter table public.user_badges enable row level security;

create policy "Lecture propres badges"
  on public.user_badges for select using (auth.uid() = user_id);

create policy "Insertion propres badges"
  on public.user_badges for insert with check (auth.uid() = user_id);


-- 3. Sessions Score Training
create table public.game_sessions (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references auth.users(id) on delete cascade not null,
  correct_count   int not null,
  total_questions int not null,
  best_streak     int default 0,
  settings        jsonb default '{}'::jsonb,
  played_at       timestamptz default now()
);

alter table public.game_sessions enable row level security;

create policy "Lecture propres sessions game"
  on public.game_sessions for select
  using (auth.uid() = user_id);

create policy "Insertion propres sessions game"
  on public.game_sessions for insert
  with check (auth.uid() = user_id);

create policy "Suppression propres sessions game"
  on public.game_sessions for delete
  using (auth.uid() = user_id);


-- 4. Sessions Échauffement
create table public.warmup_sessions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users(id) on delete cascade not null,
  zone         jsonb not null,
  total_darts  int not null,
  hits         int not null,
  accuracy     numeric(5,2),
  duration_s   int,
  settings     jsonb default '{}'::jsonb,
  played_at    timestamptz default now()
);

alter table public.warmup_sessions enable row level security;

create policy "Lecture propres sessions warmup"
  on public.warmup_sessions for select
  using (auth.uid() = user_id);

create policy "Insertion propres sessions warmup"
  on public.warmup_sessions for insert
  with check (auth.uid() = user_id);

create policy "Suppression propres sessions warmup"
  on public.warmup_sessions for delete
  using (auth.uid() = user_id);


-- 5. Amitiés
create table public.friendships (
  id           uuid primary key default gen_random_uuid(),
  requester_id uuid references public.profiles(id) on delete cascade not null,
  addressee_id uuid references public.profiles(id) on delete cascade not null,
  status       text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at   timestamptz default now(),
  unique(requester_id, addressee_id)
);

alter table public.friendships enable row level security;

-- Lecture : visible si on est l'un des deux participants
create policy "Lecture propres amitiés"
  on public.friendships for select
  using (auth.uid() = requester_id or auth.uid() = addressee_id);

-- Insertion : seulement en tant que requester
create policy "Envoi demande d'ami"
  on public.friendships for insert
  with check (auth.uid() = requester_id);

-- Mise à jour : seulement l'addressee peut accepter
create policy "Acceptation demande d'ami"
  on public.friendships for update
  using (auth.uid() = addressee_id);

-- Suppression : les deux participants peuvent supprimer
create policy "Suppression amitié"
  on public.friendships for delete
  using (auth.uid() = requester_id or auth.uid() = addressee_id);


-- ============================================================
-- Sessions X01 (501 / 301)
-- ============================================================

create table public.x01_sessions (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid references auth.users on delete cascade not null,
  played_at           timestamptz default now(),
  start_score         int not null,
  legs_played         int not null,
  avg_volley          numeric,
  avg_9darts          numeric,
  avg_darts_to_finish numeric,
  min_darts           int,
  max_darts           int,
  highest_finish      int,
  highest_volley      int,
  doubles_hit         int,
  doubles_attempted   int,
  total_darts         int,
  settings            jsonb,
  volley_distribution jsonb,
  leg_averages        jsonb,
  opponent_data       jsonb,
  match_stats         jsonb, -- stats par joueur, match + par leg (buildMatchStats)
  linked_friend_id    uuid references public.profiles(id) on delete set null
);

alter table public.x01_sessions enable row level security;

create policy "Users manage own x01_sessions"
  on public.x01_sessions for all
  using (auth.uid() = user_id);

-- Migration si la table existe déjà sans les colonnes doubles :
-- alter table public.x01_sessions
--   add column if not exists doubles_hit       int,
--   add column if not exists doubles_attempted  int,
--   add column if not exists total_darts        int;

-- Migration stats de fin de match (façon Scolia) :
-- alter table public.x01_sessions add column if not exists match_stats jsonb;


-- ============================================================
-- Sessions Tactics (fermeture façon cricket, 20→12 puis Double/Triple/Bull)
-- ============================================================

create table public.tactics_sessions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users on delete cascade not null,
  played_at    timestamptz default now(),
  legs_played  int not null,
  total_darts  int,
  avg_darts    numeric,
  min_darts    int,
  max_darts    int,
  settings     jsonb
);

alter table public.tactics_sessions enable row level security;

create policy "Users manage own tactics_sessions"
  on public.tactics_sessions for all
  using (auth.uid() = user_id);


-- ============================================================
-- Sessions Checkouts (quiz de révision des finish, 2→170)
-- Seul le quiz noté est persisté (la révision libre est du browsing).
-- ============================================================

create table public.checkout_sessions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references auth.users on delete cascade not null,
  played_at     timestamptz default now(),
  questions     int not null,
  correct_count int not null,
  optimal_count int not null default 0,
  best_streak   int not null default 0,
  points        int not null default 0,
  settings      jsonb default '{}'::jsonb
);

alter table public.checkout_sessions enable row level security;

create policy "Users manage own checkout_sessions"
  on public.checkout_sessions for all
  using (auth.uid() = user_id);


-- ============================================================
-- Mode Tournoi (format Bracket) — V2 : hôtes, invitation par code,
-- flow création (pending) → démarrage (in_progress)
-- ============================================================

create table public.tournaments (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid references auth.users(id) on delete cascade not null, -- créateur
  name                  text not null,
  description           text,
  join_code             text unique, -- généré par trigger, format T-XXXXX
  format                text not null default 'bracket'
                          check (format in ('bracket', 'round_robin', 'championship')),
  start_score           int not null,
  legs_to_win           int not null,
  seeding_method        text check (seeding_method in ('random', 'manual')), -- choisi au démarrage
  double_elimination    boolean default false,                                -- choisi au démarrage
  player_count          int not null default 0,
  status                text not null default 'pending'
                          check (status in ('pending', 'in_progress', 'completed')),
  winner_participant_id uuid,
  created_at            timestamptz default now(),
  completed_at          timestamptz
);

create table public.tournament_hosts (
  id            uuid primary key default gen_random_uuid(),
  tournament_id uuid references public.tournaments(id) on delete cascade not null,
  user_id       uuid references auth.users(id) on delete cascade not null,
  role          text not null default 'host' check (role in ('creator', 'host')),
  added_by      uuid references auth.users(id) on delete set null,
  created_at    timestamptz default now(),
  unique(tournament_id, user_id)
);

create table public.tournament_participants (
  id               uuid primary key default gen_random_uuid(),
  tournament_id    uuid references public.tournaments(id) on delete cascade not null,
  seed             int, -- assigné seulement au démarrage du tournoi
  user_id          uuid references auth.users(id) on delete set null, -- rempli si auto-inscription
  player_data      jsonb not null, -- { id, name, isMe?, isFriend?, isRegistered?, isGuest? }
  linked_friend_id uuid references public.profiles(id) on delete set null,
  created_at       timestamptz default now(),
  unique(tournament_id, seed)
);

alter table public.tournaments
  add constraint tournaments_winner_fk
  foreign key (winner_participant_id) references public.tournament_participants(id) on delete set null;

create table public.tournament_matches (
  id                     uuid primary key default gen_random_uuid(),
  tournament_id          uuid references public.tournaments(id) on delete cascade not null,
  round                  int not null,
  bracket_type           text not null default 'winner' check (bracket_type in ('winner', 'loser', 'grand_final')),
  slot_in_round          int not null,
  player1_participant_id uuid references public.tournament_participants(id) on delete set null,
  player2_participant_id uuid references public.tournament_participants(id) on delete set null,
  winner_participant_id  uuid references public.tournament_participants(id) on delete set null,
  status                 text not null default 'pending'
                           check (status in ('pending', 'ready', 'in_progress', 'bye', 'completed')),
  next_match_id          uuid references public.tournament_matches(id) on delete set null,
  next_match_slot        int check (next_match_slot in (1, 2)),
  loser_next_match_id    uuid references public.tournament_matches(id) on delete set null,
  loser_next_match_slot  int check (loser_next_match_slot in (1, 2)),
  created_at             timestamptz default now(),
  played_at              timestamptz,
  player1_legs           int,
  player2_legs           int,
  unique(tournament_id, bracket_type, round, slot_in_round)
);

alter table public.x01_sessions
  add column if not exists tournament_id       uuid references public.tournaments(id) on delete set null,
  add column if not exists tournament_match_id uuid references public.tournament_matches(id) on delete set null;

create index if not exists idx_x01_sessions_tournament_match on public.x01_sessions(tournament_match_id);
create index if not exists idx_tournament_participants_tournament on public.tournament_participants(tournament_id);
create index if not exists idx_tournament_participants_user on public.tournament_participants(user_id);
create index if not exists idx_tournament_matches_tournament on public.tournament_matches(tournament_id);
create index if not exists idx_tournament_hosts_tournament on public.tournament_hosts(tournament_id);
create index if not exists idx_tournament_hosts_user on public.tournament_hosts(user_id);

alter table public.tournaments             enable row level security;
alter table public.tournament_hosts        enable row level security;
alter table public.tournament_participants enable row level security;
alter table public.tournament_matches      enable row level security;

-- Évite la récursion de policy en lisant tournament_hosts depuis une policy sur cette table
create or replace function public.is_tournament_host(t_id uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.tournament_hosts h
    where h.tournament_id = t_id and h.user_id = auth.uid()
  );
$$;
revoke execute on function public.is_tournament_host(uuid) from public, anon;
grant execute on function public.is_tournament_host(uuid) to authenticated;

-- Idem pour un check "suis-je participant" : sert dans une policy SUR
-- tournament_participants elle-même (voir plus bas), donc doit être
-- SECURITY DEFINER pour éviter une récursion infinie de policy.
create or replace function public.is_tournament_participant(t_id uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.tournament_participants p
    where p.tournament_id = t_id and p.user_id = auth.uid()
  );
$$;
revoke execute on function public.is_tournament_participant(uuid) from public, anon;
grant execute on function public.is_tournament_participant(uuid) to authenticated;

-- INSERT à part : au moment de la création, aucune ligne tournament_hosts
-- n'existe encore pour ce tournoi (elle est insérée juste après) donc
-- is_tournament_host(id) serait toujours faux ici — on autorise via user_id.
create policy "Creator can insert tournaments"
  on public.tournaments for insert
  with check (auth.uid() = user_id);

-- Le créateur doit toujours voir son propre tournoi via user_id (pas seulement
-- via tournament_hosts) : juste après l'INSERT, insert(...).select() fait un
-- RETURNING soumis aux policies SELECT, avant que la ligne tournament_hosts
-- n'existe (elle est créée par l'appel suivant).
create policy "Creator can read own tournaments"
  on public.tournaments for select using (auth.uid() = user_id);

-- Hôtes : lecture/mise à jour/suppression sur leur tournoi (une fois la ligne
-- tournament_hosts créée)
create policy "Hosts select their tournaments"
  on public.tournaments for select using (public.is_tournament_host(id));
create policy "Hosts update their tournaments"
  on public.tournaments for update
  using (public.is_tournament_host(id)) with check (public.is_tournament_host(id));
create policy "Hosts delete their tournaments"
  on public.tournaments for delete using (public.is_tournament_host(id));

-- Participants : lecture seule sur les tournois où ils sont inscrits
create policy "Participants read their tournaments"
  on public.tournaments for select
  using (public.is_tournament_participant(id));

create policy "Hosts read host list"
  on public.tournament_hosts for select using (public.is_tournament_host(tournament_id));

create policy "Participants read host list"
  on public.tournament_hosts for select using (public.is_tournament_participant(tournament_id));

-- Un hôte existant peut en ajouter un autre ; sinon le créateur du tournoi
-- (tournaments.user_id) peut s'auto-ajouter comme premier hôte à la création,
-- avant qu'aucune ligne tournament_hosts n'existe encore pour ce tournoi.
create policy "Hosts add co-hosts"
  on public.tournament_hosts for insert
  with check (
    public.is_tournament_host(tournament_id)
    or (
      user_id = auth.uid()
      and exists (select 1 from public.tournaments t where t.id = tournament_id and t.user_id = auth.uid())
    )
  );

create policy "Hosts remove co-hosts"
  on public.tournament_hosts for delete using (public.is_tournament_host(tournament_id));

create policy "Hosts manage participants"
  on public.tournament_participants for all
  using (public.is_tournament_host(tournament_id))
  with check (public.is_tournament_host(tournament_id));

create policy "Participants read roster"
  on public.tournament_participants for select
  using (public.is_tournament_participant(tournament_id));

-- Auto-inscription / départ, indépendants des droits hôte
create policy "Self-service join"
  on public.tournament_participants for insert with check (user_id = auth.uid());
create policy "Self-service leave"
  on public.tournament_participants for delete using (user_id = auth.uid());

-- Scoring réservé aux hôtes (jeu en pass-and-play local sur l'appareil de l'hôte)
create policy "Hosts manage matches"
  on public.tournament_matches for all
  using (public.is_tournament_host(tournament_id))
  with check (public.is_tournament_host(tournament_id));

create policy "Participants read matches"
  on public.tournament_matches for select
  using (public.is_tournament_participant(tournament_id));

-- ── Rejoindre par code ───────────────────────────────────────────────────────

create or replace function public.find_tournament_by_join_code(code text)
returns table (
  id uuid, name text, description text, host_name text,
  participant_count int, status text
)
language sql stable security definer set search_path = public as $$
  select t.id, t.name, t.description,
         coalesce(p.username, p.first_name, 'Hôte') as host_name,
         (select count(*) from public.tournament_participants tp where tp.tournament_id = t.id)::int,
         t.status
  from public.tournaments t
  join public.tournament_hosts h on h.tournament_id = t.id and h.role = 'creator'
  left join public.profiles p on p.id = h.user_id
  where t.join_code = upper(code)
  limit 1;
$$;
grant execute on function public.find_tournament_by_join_code(text) to authenticated, anon;

create or replace function public.join_tournament_by_code(code text)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  t_id uuid;
  t_status text;
  joined_id uuid;
begin
  select id, status into t_id, t_status from public.tournaments where join_code = upper(code);
  if t_id is null then
    raise exception 'Code de tournoi invalide';
  end if;
  if t_status <> 'pending' then
    raise exception 'Ce tournoi a déjà démarré';
  end if;

  insert into public.tournament_participants (tournament_id, user_id, player_data)
  values (
    t_id, auth.uid(),
    jsonb_build_object(
      'id', auth.uid(),
      'name', (select coalesce(username, first_name, 'Joueur') from public.profiles where id = auth.uid()),
      'isRegistered', true
    )
  )
  on conflict do nothing
  returning tournament_id into joined_id;

  return coalesce(joined_id, t_id);
end;
$$;
grant execute on function public.join_tournament_by_code(text) to authenticated;

-- Génération automatique du join_code à la création
create or replace function public.generate_tournament_join_code()
returns trigger
language plpgsql security definer set search_path = public as $$
declare
  new_code text;
  code_exists boolean;
begin
  if new.join_code is not null then
    return new;
  end if;
  loop
    new_code := 'T-' || upper(substring(md5(random()::text) from 1 for 5));
    select exists(select 1 from public.tournaments where join_code = new_code) into code_exists;
    exit when not code_exists;
  end loop;
  new.join_code := new_code;
  return new;
end;
$$;
revoke execute on function public.generate_tournament_join_code() from public, anon, authenticated;

create trigger before_tournament_insert
  before insert on public.tournaments
  for each row execute procedure public.generate_tournament_join_code();

-- Realtime : nécessaire pour la pastille "nouveau tournoi" sur la nav (tournamentStore
-- s'abonne aux changements de tournament_participants pour l'utilisateur courant).
-- Par défaut seule la table publiée explicitement reçoit les événements postgres_changes.
alter publication supabase_realtime add table public.tournament_participants;
alter publication supabase_realtime add table public.tournaments;
alter publication supabase_realtime add table public.tournament_hosts;
alter publication supabase_realtime add table public.tournament_matches;
alter publication supabase_realtime add table public.friendships;


-- ============================================================
-- Matchs X01 en ligne (1v1 entre deux comptes, chacun sur son appareil)
-- ============================================================
-- L'état d'un match est reconstruit côté client en rejouant online_match_events
-- dans l'ordre de seq (reprise après déconnexion). unique(match_id, seq) sert de
-- verrou optimiste : deux inserts concurrents au même seq → un seul passe.

create table public.online_matches (
  id                  uuid primary key default gen_random_uuid(),
  host_id             uuid references public.profiles(id) on delete cascade not null,
  guest_id            uuid references public.profiles(id) on delete cascade not null,
  status              text not null default 'invited'
                        check (status in ('invited', 'accepted', 'active', 'completed', 'declined', 'cancelled', 'abandoned')),
  settings            jsonb not null, -- { startScore, legsToWin, players: [{ id, name }] } (ordre = starter)
  winner_id           uuid references public.profiles(id) on delete set null,
  tournament_match_id uuid references public.tournament_matches(id) on delete set null,
  created_at          timestamptz default now(),
  check (host_id <> guest_id)
);

create index if not exists idx_online_matches_host  on public.online_matches(host_id);
create index if not exists idx_online_matches_guest on public.online_matches(guest_id);
-- Un seul match en ligne ouvert par match de tournoi
create unique index if not exists idx_online_matches_open_tournament_match
  on public.online_matches(tournament_match_id)
  where tournament_match_id is not null and status in ('invited', 'accepted', 'active');

create table public.online_match_events (
  id         bigint generated always as identity primary key,
  match_id   uuid references public.online_matches(id) on delete cascade not null,
  seq        int not null,
  player_id  uuid references public.profiles(id) on delete cascade not null,
  type       text not null check (type in ('volley', 'undo')),
  payload    jsonb not null default '{}'::jsonb,
  created_at timestamptz default now(),
  unique(match_id, seq)
);

alter table public.online_matches      enable row level security;
alter table public.online_match_events enable row level security;

-- Un match ne peut viser qu'un ami accepté, ou l'adversaire d'un match de tournoi prêt
create or replace function public.can_create_online_match(guest uuid, t_match_id uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select case
    when t_match_id is null then exists (
      select 1 from public.friendships f
      where f.status = 'accepted'
        and ((f.requester_id = auth.uid() and f.addressee_id = guest)
          or (f.requester_id = guest and f.addressee_id = auth.uid()))
    )
    else exists (
      select 1
      from public.tournament_matches m
      join public.tournament_participants p1 on p1.id = m.player1_participant_id
      join public.tournament_participants p2 on p2.id = m.player2_participant_id
      where m.id = t_match_id
        and m.status = 'ready'
        and ((p1.user_id = auth.uid() and p2.user_id = guest)
          or (p1.user_id = guest and p2.user_id = auth.uid()))
    )
  end;
$$;
revoke execute on function public.can_create_online_match(uuid, uuid) from public, anon;
grant execute on function public.can_create_online_match(uuid, uuid) to authenticated;

create policy "Players read their online matches"
  on public.online_matches for select
  using (auth.uid() in (host_id, guest_id));

create policy "Host creates online match"
  on public.online_matches for insert
  with check (
    host_id = auth.uid()
    and status = 'invited'
    and public.can_create_online_match(guest_id, tournament_match_id)
  );

create policy "Players update their online matches"
  on public.online_matches for update
  using (auth.uid() in (host_id, guest_id))
  with check (auth.uid() in (host_id, guest_id));

-- Seuls status et winner_id sont modifiables après création
revoke update on public.online_matches from authenticated, anon;
grant update (status, winner_id) on public.online_matches to authenticated;

-- Transitions autorisées : invité → accepte/refuse, hôte → annule l'invitation,
-- hôte → démarre un match accepté (après le bull, via start_online_match),
-- n'importe quel joueur → annule un match accepté / termine ou abandonne un match actif.
create or replace function public.check_online_match_transition()
returns trigger
language plpgsql set search_path = public as $$
begin
  if new.status = old.status and new.winner_id is not distinct from old.winner_id then
    return new;
  end if;
  if not (
       (old.status = 'invited'  and new.status in ('accepted', 'declined') and auth.uid() = old.guest_id)
    or (old.status = 'invited'  and new.status = 'cancelled' and auth.uid() = old.host_id)
    or (old.status = 'accepted' and new.status = 'active' and auth.uid() = old.host_id)
    or (old.status = 'accepted' and new.status = 'cancelled')
    or (old.status = 'active'   and new.status in ('completed', 'abandoned'))
  ) then
    raise exception 'Transition de match invalide : % → %', old.status, new.status;
  end if;
  if new.winner_id is not null and new.winner_id not in (old.host_id, old.guest_id) then
    raise exception 'Vainqueur invalide';
  end if;
  return new;
end;
$$;

create trigger before_online_match_update
  before update on public.online_matches
  for each row execute procedure public.check_online_match_transition();

create policy "Players read match events"
  on public.online_match_events for select
  using (exists (
    select 1 from public.online_matches m
    where m.id = match_id and auth.uid() in (m.host_id, m.guest_id)
  ));

create policy "Players append own events to active match"
  on public.online_match_events for insert
  with check (
    player_id = auth.uid()
    and exists (
      select 1 from public.online_matches m
      where m.id = match_id and m.status = 'active' and auth.uid() in (m.host_id, m.guest_id)
    )
  );

-- Après le bull, l'hôte désigne qui commence : réordonne settings.players (non
-- modifiable directement, cf. grant update plus haut) et démarre le match.
create or replace function public.start_online_match(p_match_id uuid, p_starter_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare
  om      public.online_matches;
  ordered jsonb;
begin
  select * into om from public.online_matches where id = p_match_id for update;
  if om.id is null or om.host_id <> auth.uid() then
    raise exception 'Match introuvable';
  end if;
  if om.status <> 'accepted' then
    raise exception 'Le match n''attend pas le choix du premier joueur';
  end if;
  if p_starter_id not in (om.host_id, om.guest_id) then
    raise exception 'Joueur invalide';
  end if;

  select jsonb_agg(p order by (p->>'id')::uuid <> p_starter_id)
  into ordered
  from jsonb_array_elements(om.settings->'players') p;

  update public.online_matches
  set settings = jsonb_set(settings, '{players}', ordered), status = 'active'
  where id = p_match_id;
end;
$$;
revoke execute on function public.start_online_match(uuid, uuid) from public, anon;
grant execute on function public.start_online_match(uuid, uuid) to authenticated;

-- Résultat d'un match de tournoi joué en ligne : tournament_matches n'est modifiable
-- que par les hôtes, donc un joueur passe par cette fonction. Reprend la logique de
-- tournamentStore.recordMatchResult / advanceParticipant. Idempotente.
create or replace function public.report_online_tournament_result(p_online_match_id uuid, p_host_legs int, p_guest_legs int)
returns void
language plpgsql security definer set search_path = public as $$
declare
  om         public.online_matches;
  tm         public.tournament_matches;
  max_legs   int;
  winner_pid uuid;
  loser_pid  uuid;
  host_legs  int;
  guest_legs int;
  host_pid   uuid;
begin
  select * into om from public.online_matches where id = p_online_match_id;
  if om.id is null or auth.uid() not in (om.host_id, om.guest_id) then
    raise exception 'Match introuvable';
  end if;
  if om.status not in ('completed', 'abandoned') or om.winner_id is null or om.tournament_match_id is null then
    raise exception 'Match non terminé ou hors tournoi';
  end if;

  select * into tm from public.tournament_matches where id = om.tournament_match_id for update;
  if tm.status = 'completed' then
    return;
  end if;

  select p.id into winner_pid from public.tournament_participants p
  where p.id in (tm.player1_participant_id, tm.player2_participant_id) and p.user_id = om.winner_id;
  if winner_pid is null then
    raise exception 'Vainqueur absent du match de tournoi';
  end if;
  loser_pid := case when tm.player1_participant_id = winner_pid
                    then tm.player2_participant_id else tm.player1_participant_id end;

  select legs_to_win into max_legs from public.tournaments where id = tm.tournament_id;
  host_legs  := case when p_host_legs  between 0 and max_legs then p_host_legs  end;
  guest_legs := case when p_guest_legs between 0 and max_legs then p_guest_legs end;
  select p.id into host_pid from public.tournament_participants p
  where p.id in (tm.player1_participant_id, tm.player2_participant_id) and p.user_id = om.host_id;

  update public.tournament_matches
  set winner_participant_id = winner_pid,
      status       = 'completed',
      played_at    = now(),
      player1_legs = case when player1_participant_id = host_pid then host_legs else guest_legs end,
      player2_legs = case when player2_participant_id = host_pid then host_legs else guest_legs end
  where id = tm.id;

  if tm.next_match_id is not null then
    perform public.advance_tournament_participant(tm.next_match_id, tm.next_match_slot, winner_pid);
  end if;
  if tm.loser_next_match_id is not null and loser_pid is not null then
    perform public.advance_tournament_participant(tm.loser_next_match_id, tm.loser_next_match_slot, loser_pid);
  end if;
  if tm.next_match_id is null then
    update public.tournaments
    set status = 'completed', winner_participant_id = winner_pid, completed_at = now()
    where id = tm.tournament_id;
  end if;
end;
$$;

create or replace function public.advance_tournament_participant(p_match_id uuid, p_slot int, p_participant_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_slot = 1 then
    update public.tournament_matches set player1_participant_id = p_participant_id where id = p_match_id;
  else
    update public.tournament_matches set player2_participant_id = p_participant_id where id = p_match_id;
  end if;
  update public.tournament_matches set status = 'ready'
  where id = p_match_id and status = 'pending'
    and player1_participant_id is not null and player2_participant_id is not null;
end;
$$;
revoke execute on function public.advance_tournament_participant(uuid, int, uuid) from public, anon, authenticated;
revoke execute on function public.report_online_tournament_result(uuid, int, int) from public, anon;
grant execute on function public.report_online_tournament_result(uuid, int, int) to authenticated;

-- Un match de tournoi joué en ligne passe « en cours » dès que le match en ligne
-- démarre, pour que tous les participants le voient (online_matches n'est lisible
-- que par ses deux joueurs).
create or replace function public.mark_tournament_match_in_progress()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update public.tournament_matches set status = 'in_progress'
  where id = new.tournament_match_id and status = 'ready';
  return new;
end;
$$;
revoke execute on function public.mark_tournament_match_in_progress() from public, anon, authenticated;

create trigger after_online_match_active
  after update of status on public.online_matches
  for each row
  when (new.status = 'active' and old.status <> 'active' and new.tournament_match_id is not null)
  execute procedure public.mark_tournament_match_in_progress();

alter publication supabase_realtime add table public.online_matches;
alter publication supabase_realtime add table public.online_match_events;

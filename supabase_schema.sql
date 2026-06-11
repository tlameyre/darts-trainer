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

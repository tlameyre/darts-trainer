-- ============================================================
-- DARTS TRAINER — Supabase schema
-- Exécuter dans : Supabase Dashboard > SQL Editor
-- ============================================================

-- 1. Profiles (1 par utilisateur)
create table public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  first_name text,
  last_name  text,
  username   text,
  settings   jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Lecture du propre profil"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Mise à jour du propre profil"
  on public.profiles for update
  using (auth.uid() = id);

-- Créer automatiquement un profil à l'inscription
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, username)
  values (new.id, new.raw_user_meta_data->>'username');
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


-- 3. Sessions Échauffement
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

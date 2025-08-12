-- PARTE 1: Tablas, RLS y función de leaderboard

-- 1) Crear tablas si no existen
create table if not exists public.agent_ratings (
    id uuid primary key default gen_random_uuid(),
    client_id uuid not null references auth.users(id),
    agent_id uuid not null references auth.users(id),
    trato_rating int not null check (trato_rating between 1 and 5),
    asesoramiento_rating int not null check (asesoramiento_rating between 1 and 5),
    comment text,
    created_at timestamptz default now()
);

create table if not exists public.agent_performance (
    id uuid primary key default gen_random_uuid(),
    agent_id uuid not null references auth.users(id) on delete cascade,
    average_rating numeric(3,2) default 0.0,
    total_ratings int default 0,
    properties_sold_month int default 0,
    franchise_rank int,
    global_rank int,
    last_updated timestamptz default now()
);

-- Asegurar unicidad por agente (si no existe)
create unique index if not exists agent_performance_agent_id_key on public.agent_performance(agent_id);

-- Tabla mínima de perfiles para soportar el JOIN y, opcionalmente, filtrar por franquicia
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  franchise_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2) Habilitar RLS
alter table public.agent_ratings enable row level security;
alter table public.agent_performance enable row level security;
alter table public.profiles enable row level security;

-- 3) Políticas de RLS
-- agent_performance: lectura pública para el leaderboard
drop policy if exists "Public can read leaderboard performance" on public.agent_performance;
create policy "Public can read leaderboard performance"
on public.agent_performance
for select
to anon, authenticated
using (true);

-- agent_ratings: los usuarios crean/gestionan sus propias valoraciones, y pueden ver las suyas o las que les hicieron
drop policy if exists "Users can insert their own ratings" on public.agent_ratings;
create policy "Users can insert their own ratings"
on public.agent_ratings
for insert
to authenticated
with check (auth.uid() = client_id);

drop policy if exists "Users can view ratings about them or by them" on public.agent_ratings;
create policy "Users can view ratings about them or by them"
on public.agent_ratings
for select
to authenticated
using (auth.uid() = client_id or auth.uid() = agent_id);

drop policy if exists "Users can update their own ratings" on public.agent_ratings;
create policy "Users can update their own ratings"
on public.agent_ratings
for update
to authenticated
using (auth.uid() = client_id);

drop policy if exists "Users can delete their own ratings" on public.agent_ratings;
create policy "Users can delete their own ratings"
on public.agent_ratings
for delete
to authenticated
using (auth.uid() = client_id);

-- profiles: lectura pública; inserción/edición solo por el propio usuario
drop policy if exists "Profiles are viewable by everyone" on public.profiles;
create policy "Profiles are viewable by everyone"
on public.profiles
for select
to anon, authenticated
using (true);

drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile"
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
on public.profiles
for update
to authenticated
using (auth.uid() = id);

-- 4) Funciones/Triggers utilitarios para timestamps
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Trigger en profiles.updated_at
drop trigger if exists update_profiles_updated_at on public.profiles;
create trigger update_profiles_updated_at
before update on public.profiles
for each row
execute function public.update_updated_at_column();

-- Trigger para mantener last_updated en agent_performance
create or replace function public.touch_last_updated()
returns trigger as $$
begin
  new.last_updated = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists touch_agent_performance_last_updated on public.agent_performance;
create trigger touch_agent_performance_last_updated
before update on public.agent_performance
for each row
execute function public.touch_last_updated();

-- 5) Función del Leaderboard (SECURITY DEFINER) y permisos
create or replace function public.get_franchise_leaderboard(franchise_id_param uuid)
returns table (
  rank bigint,
  name text,
  average_rating numeric,
  sales_month int
) language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select
    rank() over (order by ap.average_rating desc, ap.properties_sold_month desc, ap.last_updated desc) as rank,
    coalesce(nullif(p.full_name, ''), ('Agente ' || substring(ap.agent_id::text, 1, 8))) as name,
    ap.average_rating,
    ap.properties_sold_month as sales_month
  from public.agent_performance ap
  left join public.profiles p on ap.agent_id = p.id
  where (franchise_id_param is null or p.franchise_id = franchise_id_param)
  order by rank;
end;
$$;

grant execute on function public.get_franchise_leaderboard(uuid) to anon, authenticated;

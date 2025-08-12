-- Enable PostGIS for geolocation support
create extension if not exists postgis;

-- Expand properties table with new fields (idempotent)
alter table public.properties
  add column if not exists has_pool boolean default false,
  add column if not exists pet_friendly boolean default false,
  add column if not exists has_garage boolean default false,
  add column if not exists video_url text,
  add column if not exists plans_url text[],
  add column if not exists geolocation geography(Point);

-- Optional indexes (lightweight)
create index if not exists idx_properties_geolocation on public.properties using gist (geolocation);

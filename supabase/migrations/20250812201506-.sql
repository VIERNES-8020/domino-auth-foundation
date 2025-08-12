-- Create storage buckets for property assets
insert into storage.buckets (id, name, public)
values
  ('property-photos', 'property-photos', true),
  ('property-plans', 'property-plans', true)
on conflict (id) do nothing;

-- Policies for property-photos
create policy if not exists "Public read - property photos"
  on storage.objects for select
  using (bucket_id = 'property-photos');

create policy if not exists "Users can upload to their folder - property photos"
  on storage.objects for insert
  with check (
    bucket_id = 'property-photos'
    and auth.role() = 'authenticated'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy if not exists "Users can update their own files - property photos"
  on storage.objects for update
  using (
    bucket_id = 'property-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy if not exists "Users can delete their own files - property photos"
  on storage.objects for delete
  using (
    bucket_id = 'property-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Policies for property-plans
create policy if not exists "Public read - property plans"
  on storage.objects for select
  using (bucket_id = 'property-plans');

create policy if not exists "Users can upload to their folder - property plans"
  on storage.objects for insert
  with check (
    bucket_id = 'property-plans'
    and auth.role() = 'authenticated'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy if not exists "Users can update their own files - property plans"
  on storage.objects for update
  using (
    bucket_id = 'property-plans'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy if not exists "Users can delete their own files - property plans"
  on storage.objects for delete
  using (
    bucket_id = 'property-plans'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
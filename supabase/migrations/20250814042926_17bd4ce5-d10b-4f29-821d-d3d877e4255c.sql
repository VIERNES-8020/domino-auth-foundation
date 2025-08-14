-- Add more role values to the app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'super_admin';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'franchise_admin';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'office_manager';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'supervisor';
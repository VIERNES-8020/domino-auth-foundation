-- Add rejection_reason column to sale_closures table
ALTER TABLE public.sale_closures 
ADD COLUMN rejection_reason text;
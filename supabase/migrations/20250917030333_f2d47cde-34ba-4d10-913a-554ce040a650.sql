-- Ensure property_visits.status allows 'rescheduled'
ALTER TABLE public.property_visits DROP CONSTRAINT IF EXISTS property_visits_status_check;

ALTER TABLE public.property_visits
ADD CONSTRAINT property_visits_status_check
CHECK (status IN ('pending','confirmed','cancelled','rescheduled'));

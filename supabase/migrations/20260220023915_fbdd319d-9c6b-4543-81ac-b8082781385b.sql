-- Backfill assignment_date for users who have a rol_id but no assignment_date
UPDATE profiles 
SET assignment_date = updated_at 
WHERE rol_id IS NOT NULL AND assignment_date IS NULL;
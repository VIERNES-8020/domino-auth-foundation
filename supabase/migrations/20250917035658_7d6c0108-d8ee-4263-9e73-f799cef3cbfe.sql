-- Delete all pending property visits to start fresh
DELETE FROM property_visits WHERE status = 'pending';
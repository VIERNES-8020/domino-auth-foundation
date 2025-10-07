-- Añadir foreign key entre property_visits y properties
ALTER TABLE public.property_visits
ADD CONSTRAINT property_visits_property_id_fkey
FOREIGN KEY (property_id)
REFERENCES public.properties(id)
ON DELETE CASCADE;
-- Create storage buckets for property videos and plans if they don't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('property-videos', 'property-videos', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('property-plans', 'property-plans', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for property videos (private)
CREATE POLICY "Agents can upload their own property videos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'property-videos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Agents can view their own property videos" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'property-videos' AND auth.uid() IS NOT NULL);

-- Create storage policies for property plans (public for client viewing)
CREATE POLICY "Plans are publicly viewable" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'property-plans');

CREATE POLICY "Agents can upload property plans" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'property-plans' AND auth.uid() IS NOT NULL);
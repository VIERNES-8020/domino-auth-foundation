-- Create testimonials table for the admin management system
CREATE TABLE IF NOT EXISTS public.testimonials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_name TEXT NOT NULL,
  transaction_type TEXT NOT NULL,
  comment TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  is_approved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

-- Create policies for testimonials
CREATE POLICY "Anyone can view approved testimonials" 
ON public.testimonials 
FOR SELECT 
USING (is_approved = true);

CREATE POLICY "Super admins can manage all testimonials" 
ON public.testimonials 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM super_admins 
  WHERE user_id = auth.uid()
));

-- Create about_page_content table for About Us page management
CREATE TABLE IF NOT EXISTS public.about_page_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  section_key TEXT NOT NULL UNIQUE,
  title TEXT,
  content TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.about_page_content ENABLE ROW LEVEL SECURITY;

-- Create policies for about page content
CREATE POLICY "Anyone can view about page content" 
ON public.about_page_content 
FOR SELECT 
USING (true);

CREATE POLICY "Super admins can manage about page content" 
ON public.about_page_content 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM super_admins 
  WHERE user_id = auth.uid()
));

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_testimonials_updated_at
  BEFORE UPDATE ON testimonials
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_about_page_content_updated_at
  BEFORE UPDATE ON about_page_content
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default about page content
INSERT INTO public.about_page_content (section_key, title, content, image_url) VALUES
('ceo_section', 'Nuestra CEO y Fundadora', 'DOMINIO Inmobiliaria nació de la visión de crear la red de franquicias inmobiliarias más grande y confiable de Bolivia. Nuestra misión es conectar personas con hogares, brindando transparencia, confianza y excelencia en cada transacción.', null),
('mission', 'Nuestra Misión', 'Ser el puente confiable entre las personas y sus sueños inmobiliarios, proporcionando servicios de excelencia y transparencia en cada transacción.', null),
('vision', 'Nuestra Visión', 'Convertirnos en la red inmobiliaria líder en Bolivia, reconocida por nuestra integridad, innovación y compromiso con nuestros clientes.', null),
('values', 'Nuestros Valores', 'Transparencia, Confianza, Excelencia, Innovación y Compromiso con nuestros clientes y comunidades.', null),
('objectives', 'Nuestros Objetivos', 'Expandir nuestra red de franquicias a nivel nacional, mantener los más altos estándares de servicio y ser el referente en el sector inmobiliario boliviano.', null)
ON CONFLICT (section_key) DO NOTHING;
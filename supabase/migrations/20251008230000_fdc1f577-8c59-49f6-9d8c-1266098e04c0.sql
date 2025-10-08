-- Eliminar el trigger antiguo que causa el error con last_updated
DROP TRIGGER IF EXISTS touch_last_updated ON public.sale_closures;

-- Eliminar el trigger existente que podría estar duplicado
DROP TRIGGER IF EXISTS update_sale_closures_updated_at ON public.sale_closures;

-- Crear función para actualizar updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Crear nuevo trigger para actualizar updated_at automáticamente
CREATE TRIGGER set_updated_at_sale_closures
BEFORE UPDATE ON public.sale_closures
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();
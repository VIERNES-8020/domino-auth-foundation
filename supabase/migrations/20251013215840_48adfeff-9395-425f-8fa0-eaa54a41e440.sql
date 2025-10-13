-- Crear tabla para solicitudes de cambios en propiedades
CREATE TABLE IF NOT EXISTS public.property_change_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  request_type TEXT NOT NULL CHECK (request_type IN ('edit', 'archive', 'assign', 'delete')),
  request_data JSONB,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES public.profiles(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.property_change_requests ENABLE ROW LEVEL SECURITY;

-- Política para que agentes puedan crear sus propias solicitudes
CREATE POLICY "Agents can create change requests"
ON public.property_change_requests
FOR INSERT
TO public
WITH CHECK (auth.uid() = agent_id);

-- Política para que agentes puedan ver sus propias solicitudes
CREATE POLICY "Agents can view their own requests"
ON public.property_change_requests
FOR SELECT
TO public
USING (auth.uid() = agent_id);

-- Política para que office managers puedan ver todas las solicitudes
CREATE POLICY "Office managers can view all requests"
ON public.property_change_requests
FOR SELECT
TO public
USING (public.user_has_role_by_name(auth.uid(), 'ADMINISTRACIÓN'));

-- Política para que office managers puedan actualizar solicitudes
CREATE POLICY "Office managers can update requests"
ON public.property_change_requests
FOR UPDATE
TO public
USING (public.user_has_role_by_name(auth.uid(), 'ADMINISTRACIÓN'))
WITH CHECK (public.user_has_role_by_name(auth.uid(), 'ADMINISTRACIÓN'));

-- Crear índices para mejor rendimiento
CREATE INDEX idx_property_change_requests_agent ON public.property_change_requests(agent_id);
CREATE INDEX idx_property_change_requests_property ON public.property_change_requests(property_id);
CREATE INDEX idx_property_change_requests_status ON public.property_change_requests(status);

-- Trigger para actualizar updated_at
CREATE TRIGGER update_property_change_requests_updated_at
BEFORE UPDATE ON public.property_change_requests
FOR EACH ROW
EXECUTE FUNCTION public.touch_last_updated();
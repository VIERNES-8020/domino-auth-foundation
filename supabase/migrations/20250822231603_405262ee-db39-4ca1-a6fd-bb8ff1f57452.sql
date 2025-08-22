-- Arreglar las políticas RLS para permitir la creación de perfiles y roles durante el registro

-- Eliminar políticas existentes problemáticas para profiles
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Crear nuevas políticas para profiles que permitan inserción durante el registro
CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id);

-- Eliminar política existente problemática para user_roles
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;

-- Crear política para user_roles que permita inserción durante el registro
CREATE POLICY "Users can insert their own role" 
ON public.user_roles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own roles" 
ON public.user_roles 
FOR SELECT 
USING (auth.uid() = user_id);

-- Crear trigger para auto-insertar perfil cuando se crea un usuario
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  RETURN NEW;
END;
$$;

-- Crear el trigger si no existe
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Limpiar roles incorrectos y establecer roles correctos basados en los datos existentes
UPDATE user_roles 
SET role = 'agent'::user_role_enum
WHERE user_id IN (
  SELECT p.id 
  FROM profiles p 
  WHERE p.full_name LIKE '%inmobiliario%' 
  OR p.full_name LIKE '%agente%'
  OR EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = p.id 
    AND ur.role = 'agent'
  )
);
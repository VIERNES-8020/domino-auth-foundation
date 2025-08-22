-- Primero, vamos a verificar y corregir los roles existentes
-- Actualizar usuarios que deberían ser agentes pero están marcados como client

-- Crear un usuario de prueba agente si no existe
DO $$
DECLARE
    test_user_id uuid;
BEGIN
    -- Buscar si existe un usuario que debería ser agente (primer usuario con full_name válido)
    SELECT id INTO test_user_id 
    FROM profiles 
    WHERE full_name IS NOT NULL 
    AND full_name != '' 
    AND id IN (SELECT user_id FROM user_roles WHERE role = 'client')
    LIMIT 1;
    
    -- Si encontramos un usuario, convertirlo a agente para pruebas
    IF test_user_id IS NOT NULL THEN
        UPDATE user_roles 
        SET role = 'agent' 
        WHERE user_id = test_user_id;
        
        RAISE NOTICE 'Usuario % convertido a agente para pruebas', test_user_id;
    END IF;
END $$;
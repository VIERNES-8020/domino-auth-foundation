-- Corriger el usuario codigocerebro8020@gmail.com para que sea superadmin

-- 1. Actualizar el perfil para marcarlo como super admin
UPDATE profiles 
SET is_super_admin = true 
WHERE id = (SELECT id FROM auth.users WHERE email = 'codigocerebro8020@gmail.com');

-- 2. Agregar el usuario a la tabla super_admins
INSERT INTO super_admins (user_id)
SELECT id FROM auth.users WHERE email = 'codigocerebro8020@gmail.com'
ON CONFLICT (user_id) DO NOTHING;

-- 3. Eliminar el rol de cliente de user_roles ya que los superadmins no deben tener roles normales
DELETE FROM user_roles 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'codigocerebro8020@gmail.com');
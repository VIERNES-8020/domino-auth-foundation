-- Cambiar a Marcela de Super Admin a Agente
UPDATE profiles 
SET is_super_admin = false 
WHERE email = 'grupoinmobiliariodomin10@gmail.com' 
   OR full_name ILIKE '%marcela carmen arispe lucas%';
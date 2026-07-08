-- Diagnóstico y fix del bucket "avatars" (fotos de perfil de trainer y clientes).
-- Correr en Supabase → SQL Editor → New query → pegar → Run.

-- 1) Ver si el bucket existe y si es público
SELECT id, name, public FROM storage.buckets WHERE id = 'avatars';
-- Si "public" da "false" (o no aparece ninguna fila), seguí con el resto.

-- 2) Marcarlo público (necesario para que las fotos se vean sin login)
UPDATE storage.buckets SET public = true WHERE id = 'avatars';

-- 3) Política de lectura pública (por si el toggle "public" del bucket
--    no alcanzó a crear la policy de SELECT en storage.objects)
DROP POLICY IF EXISTS "avatars_public_read" ON storage.objects;
CREATE POLICY "avatars_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

-- 4) Política de escritura para usuarios logueados (subir/actualizar su foto)
DROP POLICY IF EXISTS "avatars_authenticated_upload" ON storage.objects;
CREATE POLICY "avatars_authenticated_upload" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars');

DROP POLICY IF EXISTS "avatars_authenticated_update" ON storage.objects;
CREATE POLICY "avatars_authenticated_update" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'avatars');

-- 5) Verificación final
SELECT id, name, public FROM storage.buckets WHERE id = 'avatars';

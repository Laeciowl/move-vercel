-- 1. Fix volunteer-content bucket: restrict uploads to authenticated volunteers/admins only
DROP POLICY IF EXISTS "Allow authenticated users to upload content" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access to content files" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete their own uploads" ON storage.objects;

-- Recreate with proper security for volunteer-content
CREATE POLICY "Volunteers and admins can upload to volunteer-content"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'volunteer-content' 
  AND auth.role() = 'authenticated'
  AND (
    public.has_role(auth.uid(), 'voluntario') 
    OR public.has_role(auth.uid(), 'admin')
  )
);

CREATE POLICY "Public read access to volunteer-content"
ON storage.objects FOR SELECT
USING (bucket_id = 'volunteer-content');

CREATE POLICY "Owners can delete from volunteer-content"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'volunteer-content' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 2. Secure mentor-photos bucket policies
DROP POLICY IF EXISTS "Anyone can view mentor photos" ON storage.objects;
DROP POLICY IF EXISTS "Mentors can upload their own photos" ON storage.objects;
DROP POLICY IF EXISTS "Mentors can update their own photos" ON storage.objects;
DROP POLICY IF EXISTS "Mentors can delete their own photos" ON storage.objects;

CREATE POLICY "Public read access to mentor-photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'mentor-photos');

CREATE POLICY "Authenticated users can upload to mentor-photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'mentor-photos' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can update own mentor-photos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'mentor-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own mentor-photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'mentor-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 3. Update get_mentee_emails to validate mentor ownership
CREATE OR REPLACE FUNCTION public.get_mentee_emails(session_user_ids uuid[])
RETURNS TABLE(user_id uuid, email text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH current_mentor AS (
    SELECT id FROM public.mentors 
    WHERE email = public.current_user_email()
    LIMIT 1
  )
  SELECT au.id as user_id, au.email::text as email
  FROM auth.users au
  WHERE au.id = ANY(session_user_ids)
    AND EXISTS (
      SELECT 1 FROM public.mentor_sessions ms
      JOIN current_mentor cm ON cm.id = ms.mentor_id
      WHERE ms.user_id = au.id
    );
$$;
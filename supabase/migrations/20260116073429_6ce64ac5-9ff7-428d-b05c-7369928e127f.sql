-- Drop existing SELECT policy for mentors
DROP POLICY IF EXISTS "View mentors policy" ON public.mentors;

-- Create new SELECT policy that allows:
-- 1. Admins to see ALL mentors
-- 2. Anyone to see approved mentors
-- 3. Mentors to see their own profile (by email)
CREATE POLICY "View mentors policy" 
ON public.mentors 
FOR SELECT 
USING (
  status = 'approved'::mentor_status 
  OR has_role(auth.uid(), 'admin'::app_role)
  OR email = (SELECT email FROM auth.users WHERE id = auth.uid())::text
);
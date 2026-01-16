-- Create storage bucket for content files (PDFs, documents, etc.)
INSERT INTO storage.buckets (id, name, public)
VALUES ('content-files', 'content-files', true);

-- Allow authenticated users to view content files
CREATE POLICY "Anyone can view content files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'content-files');

-- Only admins can upload content files
CREATE POLICY "Admins can upload content files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'content-files' 
    AND public.has_role(auth.uid(), 'admin')
  );

-- Only admins can delete content files
CREATE POLICY "Admins can delete content files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'content-files' 
    AND public.has_role(auth.uid(), 'admin')
  );
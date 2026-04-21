-- Bucket estava referenciado nas policies mas nunca foi criado nas migrações → "Bucket not found" no upload.
INSERT INTO storage.buckets (id, name, public)
VALUES ('mentor-photos', 'mentor-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload media to the 'uploads' folder in 'media' bucket
CREATE POLICY "Authenticated users can upload to uploads folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'media' AND
    (storage.foldername(name))[1] = 'uploads'
);

-- Allow authenticated users to update their own media in 'uploads' folder
CREATE POLICY "Authenticated users can update their own uploads"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'media' AND
    (storage.foldername(name))[1] = 'uploads' AND
    auth.uid() = owner
)
WITH CHECK (
    bucket_id = 'media' AND
    (storage.foldername(name))[1] = 'uploads' AND
    auth.uid() = owner
);

-- Allow authenticated users to delete their own media in 'uploads' folder
CREATE POLICY "Authenticated users can delete their own uploads"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'media' AND
    (storage.foldername(name))[1] = 'uploads' AND
    auth.uid() = owner
);

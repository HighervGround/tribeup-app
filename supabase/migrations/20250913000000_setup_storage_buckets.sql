-- Create storage buckets and policies for avatars and game images

-- Create avatars bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Create game-images bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'game-images',
  'game-images',
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy: Users can upload their own avatars
CREATE POLICY "Users can upload their own avatars" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can update their own avatars
CREATE POLICY "Users can update their own avatars" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can delete their own avatars
CREATE POLICY "Users can delete their own avatars" ON storage.objects
FOR DELETE USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Anyone can view avatars (public bucket)
CREATE POLICY "Anyone can view avatars" ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');

-- Policy: Authenticated users can upload game images
CREATE POLICY "Authenticated users can upload game images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'game-images' 
  AND auth.role() = 'authenticated'
);

-- Policy: Users can update game images they uploaded
CREATE POLICY "Users can update their game images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'game-images' 
  AND auth.uid() = owner
);

-- Policy: Users can delete game images they uploaded
CREATE POLICY "Users can delete their game images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'game-images' 
  AND auth.uid() = owner
);

-- Policy: Anyone can view game images (public bucket)
CREATE POLICY "Anyone can view game images" ON storage.objects
FOR SELECT USING (bucket_id = 'game-images');

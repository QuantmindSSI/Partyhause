-- Storage setup migration for event invite images
-- This migration creates the storage bucket and RLS policies

-- Create the storage bucket for event invite images
INSERT INTO storage.buckets (id, name, public)
VALUES ('event-invites', 'event-invites', true)
ON CONFLICT (id) DO NOTHING;

-- Create Row Level Security (RLS) policies for the event-invites bucket

-- Policy 1: Allow authenticated users to upload images for their own events
CREATE POLICY "Users can upload invite images for their events" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'event-invites' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 2: Allow public read access to invite images (for email display)
CREATE POLICY "Public read access for invite images" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'event-invites');

-- Policy 3: Allow event owners to update/delete their invite images
CREATE POLICY "Users can update their own invite images" ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'event-invites' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own invite images" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'event-invites' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
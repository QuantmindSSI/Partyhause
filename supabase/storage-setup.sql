-- Supabase Storage Setup for Event Invite Images
-- This file contains the SQL commands to set up storage buckets and policies
-- Run these commands in your Supabase SQL Editor

-- Create the storage bucket for event invite images
INSERT INTO storage.buckets (id, name, public)
VALUES ('event-invites', 'event-invites', true);

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

-- Enable RLS on the storage.objects table (if not already enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Optional: Set file size limits and allowed MIME types
-- These would be configured in the Supabase dashboard under Storage settings
-- Recommended settings:
-- - Max file size: 5MB
-- - Allowed MIME types: image/jpeg, image/png, image/webp, image/gif
-- - File path pattern: {user_id}/{event_id}_invite.*
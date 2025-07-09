-- Temporarily disable RLS for wallet-based authentication testing
-- Run these commands in your Supabase SQL editor

ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE models DISABLE ROW LEVEL SECURITY;
ALTER TABLE predictions DISABLE ROW LEVEL SECURITY; 
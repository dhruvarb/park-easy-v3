-- Migration Script for Production Database (Vercel)
-- Run this in your Supabase SQL Editor or neon console

-- 1. Add 'blueprint' column to 'parking_lots'
ALTER TABLE parking_lots 
ADD COLUMN IF NOT EXISTS blueprint TEXT;

-- 2. Add 'x', 'y', 'rotation', 'is_active' columns to 'parking_slots'
ALTER TABLE parking_slots 
ADD COLUMN IF NOT EXISTS x INTEGER DEFAULT 0;

ALTER TABLE parking_slots 
ADD COLUMN IF NOT EXISTS y INTEGER DEFAULT 0;

ALTER TABLE parking_slots 
ADD COLUMN IF NOT EXISTS rotation INTEGER DEFAULT 0;

ALTER TABLE parking_slots 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Verify changes
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name IN ('parking_lots', 'parking_slots');

-- Migration Script for Production Database (Vercel/Supabase/Neon)
-- Run this in your Supabase SQL Editor or Neon Console to fix 500 Errors

-- 1. Users Table: Add Tokens
ALTER TABLE users ADD COLUMN IF NOT EXISTS tokens NUMERIC DEFAULT 0;

-- 2. Create Token Transactions Table
CREATE TABLE IF NOT EXISTS token_transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL,
    type TEXT CHECK (type IN ('credit', 'debit')),
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Bookings Table: Add Penalty and Checkout Time
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS penalty NUMERIC DEFAULT 0;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS check_out_time TIMESTAMPTZ;

-- 4. Parking Lots: Add Blueprint and Capacity Fields
ALTER TABLE parking_lots ADD COLUMN IF NOT EXISTS blueprint TEXT;
ALTER TABLE parking_lots ADD COLUMN IF NOT EXISTS total_capacity INTEGER DEFAULT 0;
ALTER TABLE parking_lots ADD COLUMN IF NOT EXISTS capacity_breakdown JSONB DEFAULT '{}'::jsonb;

-- 5. Parking Slots: Add Coordinates and Active Status
ALTER TABLE parking_slots ADD COLUMN IF NOT EXISTS x INTEGER DEFAULT 0;
ALTER TABLE parking_slots ADD COLUMN IF NOT EXISTS y INTEGER DEFAULT 0;
ALTER TABLE parking_slots ADD COLUMN IF NOT EXISTS rotation INTEGER DEFAULT 0;
ALTER TABLE parking_slots ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- 6. Verify changes
SELECT table_name, column_name 
FROM information_schema.columns 
WHERE table_name IN ('users', 'token_transactions', 'bookings', 'parking_lots', 'parking_slots')
ORDER BY table_name;

-- Enable UUID helper (ignore if already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    role TEXT NOT NULL CHECK (role IN ('user', 'admin')),
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    address TEXT,
    upi_id TEXT,
    password_hash TEXT NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS parking_lots (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    admin_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    has_ev BOOLEAN DEFAULT FALSE,
    total_capacity INTEGER DEFAULT 0,
    capacity_breakdown JSONB DEFAULT '{}'::jsonb,
    city TEXT,
    images TEXT[] DEFAULT '{}',
    documents JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS amenities (
    id SERIAL PRIMARY KEY,
    label TEXT UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS parking_lot_amenities (
    lot_id UUID REFERENCES parking_lots(id) ON DELETE CASCADE,
    amenity_id INTEGER REFERENCES amenities(id) ON DELETE CASCADE,
    PRIMARY KEY (lot_id, amenity_id)
);

CREATE TABLE IF NOT EXISTS slot_pricing (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    lot_id UUID REFERENCES parking_lots(id) ON DELETE CASCADE,
    vehicle_type TEXT NOT NULL,
    hourly NUMERIC(10,2),
    daily NUMERIC(10,2),
    monthly NUMERIC(10,2),
    UNIQUE (lot_id, vehicle_type)
);

CREATE TABLE IF NOT EXISTS parking_slots (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    lot_id UUID REFERENCES parking_lots(id) ON DELETE CASCADE,
    label TEXT NOT NULL,
    is_ev BOOLEAN DEFAULT FALSE,
    vehicle_type TEXT NOT NULL,
    is_available BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS bookings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    slot_id UUID REFERENCES parking_slots(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    amount_paid NUMERIC(10,2),
    status TEXT DEFAULT 'confirmed',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reviews (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    lot_id UUID REFERENCES parking_lots(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS favorites (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    lot_id UUID REFERENCES parking_lots(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, lot_id)
);

CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    admin_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name TEXT,
    email TEXT,
    subject TEXT,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('payment', 'refund')),
    status TEXT NOT NULL DEFAULT 'success',
    transaction_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS refund_requests (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    admin_response TEXT,
    refund_amount NUMERIC,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed common amenities
INSERT INTO amenities (label) VALUES
  ('Security guard'),
  ('CCTV'),
  ('Shadow/Canopy'),
  ('Valet'),
  ('EV Fast Charger'),
  ('Covered Parking'),
  ('24/7 Access'),
  ('EV Charging')
ON CONFLICT (label) DO NOTHING;


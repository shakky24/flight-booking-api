-- Drop existing enum type to recreate it with consistent case
DROP TYPE IF EXISTS booking_status CASCADE;

-- Create booking_status enum type if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'booking_status') THEN
        CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'cancelled');
    END IF;
END
$$;

-- Create cabin_class enum type if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'cabin_class') THEN
        CREATE TYPE cabin_class AS ENUM ('Economy', 'Premium Economy', 'Business', 'First');
    END IF;
END
$$;

-- Update bookings table to support round trips and new passenger info
ALTER TABLE bookings 
DROP COLUMN IF EXISTS flight_id,
ADD COLUMN IF NOT EXISTS outbound_flight_id UUID REFERENCES flights(id),
ADD COLUMN IF NOT EXISTS return_flight_id UUID REFERENCES flights(id),
ADD COLUMN IF NOT EXISTS contact_email VARCHAR(255) NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(50) NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS passengers JSONB NOT NULL DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS total_price INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS booking_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
ADD COLUMN IF NOT EXISTS status booking_status NOT NULL DEFAULT 'pending';

-- Handle the cabin_class column - check if it exists
DO $$
BEGIN
    -- Check if cabin_class column exists
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'bookings' AND column_name = 'cabin_class'
    ) THEN
        -- Make it nullable if it already exists
        ALTER TABLE bookings ALTER COLUMN cabin_class DROP NOT NULL;
    ELSE
        -- Add it if it doesn't exist
        ALTER TABLE bookings ADD COLUMN cabin_class cabin_class;
    END IF;
    
    -- Check if cabin_class_id column exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'bookings' AND column_name = 'cabin_class_id'
    ) THEN
        -- Add it if it doesn't exist
        ALTER TABLE bookings ADD COLUMN cabin_class_id UUID REFERENCES flight_cabin_classes(id);
    END IF;
END
$$;

-- Create stored procedure for creating bookings
CREATE OR REPLACE FUNCTION create_booking(
  p_user_id UUID,
  p_total_price INTEGER,
  p_contact_email VARCHAR,
  p_contact_phone VARCHAR,
  p_passengers JSONB,
  p_booking_date TIMESTAMP WITH TIME ZONE,
  p_outbound_flight_id UUID,
  p_return_flight_id UUID,
  p_status TEXT,
  p_cabin_class VARCHAR,
  p_cabin_class_id UUID
) RETURNS bookings AS $$
DECLARE
  v_booking bookings;
  v_cabin_class cabin_class;
BEGIN
  -- Convert to cabin_class enum safely
  BEGIN
    v_cabin_class := p_cabin_class::cabin_class;
  EXCEPTION WHEN OTHERS THEN
    -- Default to Economy if conversion fails
    v_cabin_class := 'Economy'::cabin_class;
  END;

  -- Create the booking
  INSERT INTO bookings (
    user_id,
    outbound_flight_id,
    return_flight_id,
    total_price,
    contact_email,
    contact_phone,
    passengers,
    booking_date,
    status,
    cabin_class,
    cabin_class_id
  ) VALUES (
    p_user_id,
    p_outbound_flight_id,
    p_return_flight_id,
    p_total_price,
    p_contact_email,
    p_contact_phone,
    p_passengers,
    p_booking_date,
    p_status::booking_status,
    v_cabin_class,
    p_cabin_class_id
  ) RETURNING * INTO v_booking;

  -- Update available seats for outbound flight if cabin_class_id is provided
  IF p_cabin_class_id IS NOT NULL THEN
    UPDATE flight_cabin_classes
    SET available_seats = available_seats - jsonb_array_length(p_passengers)
    WHERE flight_id = p_outbound_flight_id 
    AND id = p_cabin_class_id;
  END IF;

  -- Update available seats for return flight if exists and cabin_class_id is provided
  IF p_return_flight_id IS NOT NULL AND p_cabin_class_id IS NOT NULL THEN
    UPDATE flight_cabin_classes
    SET available_seats = available_seats - jsonb_array_length(p_passengers)
    WHERE flight_id = p_return_flight_id
    AND id = p_cabin_class_id;
  END IF;

  RETURN v_booking;
END;
$$ LANGUAGE plpgsql;

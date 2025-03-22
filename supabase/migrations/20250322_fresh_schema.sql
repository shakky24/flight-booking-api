-- Create enum types
CREATE TYPE cabin_class AS ENUM ('Economy', 'Premium Economy', 'Business', 'First');
CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'cancelled');

-- Create airports table
CREATE TABLE IF NOT EXISTS airports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(3) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  city VARCHAR(100) NOT NULL,
  country VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create flights table
CREATE TABLE IF NOT EXISTS flights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  flight_number VARCHAR(10) NOT NULL,
  origin_id UUID REFERENCES airports(id) NOT NULL,
  destination_id UUID REFERENCES airports(id) NOT NULL,
  departure_time TIMESTAMP WITH TIME ZONE NOT NULL,
  arrival_time TIMESTAMP WITH TIME ZONE NOT NULL,
  aircraft_type VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create flight cabin classes table
CREATE TABLE IF NOT EXISTS flight_cabin_classes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  flight_id UUID REFERENCES flights(id) NOT NULL,
  cabin_class cabin_class NOT NULL,
  total_seats INTEGER NOT NULL,
  available_seats INTEGER NOT NULL,
  price INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(flight_id, cabin_class)
);

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) NOT NULL UNIQUE,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) NOT NULL,
  outbound_flight_id UUID REFERENCES flights(id) NOT NULL,
  return_flight_id UUID REFERENCES flights(id),
  cabin_class cabin_class NOT NULL,
  cabin_class_id UUID REFERENCES flight_cabin_classes(id),
  total_price INTEGER NOT NULL,
  contact_email VARCHAR(255) NOT NULL,
  contact_phone VARCHAR(50) NOT NULL,
  passengers JSONB NOT NULL DEFAULT '[]'::jsonb,
  booking_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  status booking_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Function to search flights
CREATE OR REPLACE FUNCTION search_flights(
  p_origin VARCHAR,
  p_destination VARCHAR,
  p_departure_date DATE,
  p_cabin_class cabin_class,
  p_passengers INTEGER DEFAULT 1
) RETURNS TABLE (
  id UUID,
  flight_number VARCHAR,
  origin VARCHAR,
  destination VARCHAR,
  departure_time TIMESTAMP WITH TIME ZONE,
  arrival_time TIMESTAMP WITH TIME ZONE,
  aircraft_type VARCHAR,
  duration INTERVAL,
  cabin_class cabin_class,
  cabin_class_id UUID,
  price INTEGER,
  available_seats INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    f.id,
    f.flight_number,
    origin.code AS origin,
    dest.code AS destination,
    f.departure_time,
    f.arrival_time,
    f.aircraft_type,
    f.arrival_time - f.departure_time AS duration,
    fcc.cabin_class,
    fcc.id AS cabin_class_id,
    fcc.price,
    fcc.available_seats
  FROM flights f
  JOIN airports origin ON f.origin_id = origin.id
  JOIN airports dest ON f.destination_id = dest.id
  JOIN flight_cabin_classes fcc ON f.id = fcc.flight_id
  WHERE origin.code = p_origin
  AND dest.code = p_destination
  AND DATE(f.departure_time) = p_departure_date
  AND fcc.cabin_class = p_cabin_class
  AND fcc.available_seats >= p_passengers
  ORDER BY f.departure_time;
END;
$$ LANGUAGE plpgsql;

-- Function to create a booking
CREATE OR REPLACE FUNCTION create_booking(
  p_user_id UUID,
  p_outbound_flight_id UUID,
  p_return_flight_id UUID,
  p_cabin_class cabin_class,
  p_cabin_class_id UUID,
  p_total_price INTEGER,
  p_contact_email VARCHAR,
  p_contact_phone VARCHAR,
  p_passengers JSONB,
  p_booking_date TIMESTAMP WITH TIME ZONE
) RETURNS bookings AS $$
DECLARE
  v_booking bookings;
  v_passenger_count INTEGER;
BEGIN
  v_passenger_count := jsonb_array_length(p_passengers);
  
  -- Create the booking
  INSERT INTO bookings (
    user_id,
    outbound_flight_id,
    return_flight_id,
    cabin_class,
    cabin_class_id,
    total_price,
    contact_email,
    contact_phone,
    passengers,
    booking_date,
    status
  ) VALUES (
    p_user_id,
    p_outbound_flight_id,
    p_return_flight_id,
    p_cabin_class,
    p_cabin_class_id,
    p_total_price,
    p_contact_email,
    p_contact_phone,
    p_passengers,
    p_booking_date,
    'pending'
  ) RETURNING * INTO v_booking;

  -- Update available seats for outbound flight
  UPDATE flight_cabin_classes
  SET available_seats = available_seats - v_passenger_count
  WHERE flight_id = p_outbound_flight_id 
  AND cabin_class = p_cabin_class;

  -- Update available seats for return flight if exists
  IF p_return_flight_id IS NOT NULL THEN
    UPDATE flight_cabin_classes
    SET available_seats = available_seats - v_passenger_count
    WHERE flight_id = p_return_flight_id
    AND cabin_class = p_cabin_class;
  END IF;

  RETURN v_booking;
END;
$$ LANGUAGE plpgsql;

-- Function to update a booking status
CREATE OR REPLACE FUNCTION update_booking_status(
  p_booking_id UUID,
  p_user_id UUID,
  p_status booking_status
) RETURNS bookings AS $$
DECLARE
  v_booking bookings;
BEGIN
  UPDATE bookings
  SET 
    status = p_status,
    updated_at = NOW()
  WHERE id = p_booking_id
  AND user_id = p_user_id
  RETURNING * INTO v_booking;
  
  RETURN v_booking;
END;
$$ LANGUAGE plpgsql;

-- Function to get user's bookings
CREATE OR REPLACE FUNCTION get_user_bookings(
  p_user_id UUID
) RETURNS SETOF bookings AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM bookings
  WHERE user_id = p_user_id
  ORDER BY booking_date DESC;
END;
$$ LANGUAGE plpgsql;

-- Create index for faster searches
CREATE INDEX IF NOT EXISTS idx_flights_departure_time ON flights(departure_time);
CREATE INDEX IF NOT EXISTS idx_flight_cabin_classes_flight_id ON flight_cabin_classes(flight_id);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);

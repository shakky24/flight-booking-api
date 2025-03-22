-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create cabin_classes enum
CREATE TYPE cabin_class AS ENUM ('ECONOMY', 'PREMIUM_ECONOMY', 'BUSINESS', 'FIRST');

-- Create flights table (base flight information)
CREATE TABLE flights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    flight_number VARCHAR(10) NOT NULL,
    origin VARCHAR(3) NOT NULL,
    destination VARCHAR(3) NOT NULL,
    departure_date DATE NOT NULL,
    departure_time TIME NOT NULL,
    arrival_date DATE NOT NULL,
    arrival_time TIME NOT NULL,
    aircraft_type VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create flight_cabin_classes table (cabin class specific details)
CREATE TABLE flight_cabin_classes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    flight_id UUID NOT NULL REFERENCES flights(id),
    cabin_class cabin_class NOT NULL,
    total_seats INTEGER NOT NULL,
    available_seats INTEGER NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(flight_id, cabin_class)
);

-- Create bookings table
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    flight_id UUID NOT NULL REFERENCES flights(id),
    flight_cabin_class_id UUID NOT NULL REFERENCES flight_cabin_classes(id),
    status VARCHAR(20) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    booking_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create passengers table
CREATE TABLE passengers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL REFERENCES bookings(id),
    type VARCHAR(20) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    date_of_birth DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_flights_origin_destination ON flights(origin, destination);
CREATE INDEX idx_flights_departure_date ON flights(departure_date);
CREATE INDEX idx_flight_cabin_classes_flight_id ON flight_cabin_classes(flight_id);
CREATE INDEX idx_bookings_user_id ON bookings(user_id);
CREATE INDEX idx_bookings_flight_id ON bookings(flight_id);
CREATE INDEX idx_passengers_booking_id ON passengers(booking_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers
CREATE TRIGGER update_flights_updated_at
    BEFORE UPDATE ON flights
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_flight_cabin_classes_updated_at
    BEFORE UPDATE ON flight_cabin_classes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at
    BEFORE UPDATE ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data
INSERT INTO flights (
    flight_number,
    origin,
    destination,
    departure_date,
    departure_time,
    arrival_date,
    arrival_time,
    aircraft_type
) VALUES
    ('FL001', 'NYC', 'LAX', '2025-04-01', '10:00', '2025-04-01', '13:00', 'Boeing 737'),
    ('FL002', 'LAX', 'NYC', '2025-04-01', '14:00', '2025-04-01', '17:00', 'Boeing 737');

-- Insert cabin classes for flights
INSERT INTO flight_cabin_classes (
    flight_id,
    cabin_class,
    total_seats,
    available_seats,
    price
) VALUES
    ((SELECT id FROM flights WHERE flight_number = 'FL001'), 'ECONOMY', 150, 150, 299.99),
    ((SELECT id FROM flights WHERE flight_number = 'FL001'), 'BUSINESS', 30, 30, 599.99),
    ((SELECT id FROM flights WHERE flight_number = 'FL002'), 'ECONOMY', 150, 150, 299.99),
    ((SELECT id FROM flights WHERE flight_number = 'FL002'), 'BUSINESS', 30, 30, 599.99);

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create flights table
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
    cabin_class VARCHAR(20) NOT NULL,
    total_seats INTEGER NOT NULL,
    available_seats INTEGER NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create bookings table
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    flight_id UUID NOT NULL REFERENCES flights(id),
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

-- Create indexes for better query performance
CREATE INDEX idx_flights_origin_destination ON flights(origin, destination);
CREATE INDEX idx_flights_departure_date ON flights(departure_date);
CREATE INDEX idx_bookings_user_id ON bookings(user_id);
CREATE INDEX idx_bookings_flight_id ON bookings(flight_id);
CREATE INDEX idx_passengers_booking_id ON passengers(booking_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_flights_updated_at
    BEFORE UPDATE ON flights
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at
    BEFORE UPDATE ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample flight data
INSERT INTO flights (
    flight_number,
    origin,
    destination,
    departure_date,
    departure_time,
    arrival_date,
    arrival_time,
    aircraft_type,
    cabin_class,
    total_seats,
    available_seats,
    price
) VALUES
    ('FL001', 'NYC', 'LAX', '2025-04-01', '10:00', '2025-04-01', '13:00', 'Boeing 737', 'ECONOMY', 180, 180, 299.99),
    ('FL002', 'LAX', 'NYC', '2025-04-01', '14:00', '2025-04-01', '17:00', 'Boeing 737', 'ECONOMY', 180, 180, 299.99),
    ('FL003', 'NYC', 'LAX', '2025-04-01', '11:00', '2025-04-01', '14:00', 'Airbus A320', 'BUSINESS', 120, 120, 599.99),
    ('FL004', 'LAX', 'NYC', '2025-04-01', '15:00', '2025-04-01', '18:00', 'Airbus A320', 'BUSINESS', 120, 120, 599.99);

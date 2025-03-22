-- Insert sample flights
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
    ('FL002', 'LAX', 'NYC', '2025-04-01', '14:00', '2025-04-01', '17:00', 'Boeing 737'),
    ('FL003', 'NYC', 'SFO', '2025-04-01', '11:00', '2025-04-01', '14:30', 'Airbus A320'),
    ('FL004', 'SFO', 'NYC', '2025-04-01', '15:00', '2025-04-01', '18:30', 'Airbus A320');

-- Insert cabin classes for each flight
INSERT INTO flight_cabin_classes (
    flight_id,
    cabin_class,
    total_seats,
    available_seats,
    price
) VALUES
    -- FL001 cabin classes
    ((SELECT id FROM flights WHERE flight_number = 'FL001'), 'ECONOMY', 150, 150, 299.99),
    ((SELECT id FROM flights WHERE flight_number = 'FL001'), 'BUSINESS', 30, 30, 899.99),
    ((SELECT id FROM flights WHERE flight_number = 'FL001'), 'FIRST', 10, 10, 1499.99),
    
    -- FL002 cabin classes
    ((SELECT id FROM flights WHERE flight_number = 'FL002'), 'ECONOMY', 150, 150, 299.99),
    ((SELECT id FROM flights WHERE flight_number = 'FL002'), 'BUSINESS', 30, 30, 899.99),
    ((SELECT id FROM flights WHERE flight_number = 'FL002'), 'FIRST', 10, 10, 1499.99),
    
    -- FL003 cabin classes
    ((SELECT id FROM flights WHERE flight_number = 'FL003'), 'ECONOMY', 160, 160, 349.99),
    ((SELECT id FROM flights WHERE flight_number = 'FL003'), 'PREMIUM_ECONOMY', 40, 40, 549.99),
    ((SELECT id FROM flights WHERE flight_number = 'FL003'), 'BUSINESS', 20, 20, 999.99),
    
    -- FL004 cabin classes
    ((SELECT id FROM flights WHERE flight_number = 'FL004'), 'ECONOMY', 160, 160, 349.99),
    ((SELECT id FROM flights WHERE flight_number = 'FL004'), 'PREMIUM_ECONOMY', 40, 40, 549.99),
    ((SELECT id FROM flights WHERE flight_number = 'FL004'), 'BUSINESS', 20, 20, 999.99);

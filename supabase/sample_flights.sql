-- Insert DEL-BOM route (Morning and Evening)
INSERT INTO flights (id, flight_number, origin, destination, departure_date, departure_time, arrival_date, arrival_time, aircraft_type)
VALUES 
  ('123e4567-e89b-18d3-a456-426614174000', 'AI201', 'DEL', 'BOM', '2025-04-01', '08:00:00', '2025-04-01', '10:00:00', 'Airbus A320'),
  ('123e4567-e89b-12d3-a456-426614174001', 'AI202', 'BOM', 'DEL', '2025-04-01', '11:30:00', '2025-04-01', '13:30:00', 'Airbus A320'),
  ('123e4567-e89b-12d3-a456-426614174002', 'AI203', 'DEL', 'BOM', '2025-04-01', '16:00:00', '2025-04-01', '18:00:00', 'Airbus A320'),
  ('123e4567-e89b-12d3-a456-426614174003', 'AI204', 'BOM', 'DEL', '2025-04-01', '20:00:00', '2025-04-01', '22:00:00', 'Airbus A320');

-- Insert BLR-DEL route
INSERT INTO flights (id, flight_number, origin, destination, departure_date, departure_time, arrival_date, arrival_time, aircraft_type)
VALUES 
  ('123e4567-e89b-12d3-a456-426614174004', 'AI301', 'BLR', 'DEL', '2025-04-01', '07:00:00', '2025-04-01', '09:30:00', 'Airbus A320'),
  ('123e4567-e89b-12d3-a456-426614174005', 'AI302', 'DEL', 'BLR', '2025-04-01', '10:30:00', '2025-04-01', '13:00:00', 'Airbus A320');

-- Insert cabin classes for all flights
INSERT INTO flight_cabin_classes (flight_id, cabin_class, total_seats, available_seats, price)
VALUES
  -- AI201 (DEL-BOM Morning)
  ('123e4567-e89b-18d3-a456-426614174000', 'ECONOMY', 150, 150, 4999),
  ('123e4567-e89b-18d3-a456-426614174000', 'BUSINESS', 30, 30, 14999),
  
  -- AI202 (BOM-DEL Morning Return)
  ('123e4567-e89b-12d3-a456-426614174001', 'ECONOMY', 150, 150, 4999),
  ('123e4567-e89b-12d3-a456-426614174001', 'BUSINESS', 30, 30, 14999),
  
  -- AI203 (DEL-BOM Evening)
  ('123e4567-e89b-12d3-a456-426614174002', 'ECONOMY', 150, 150, 4999),
  ('123e4567-e89b-12d3-a456-426614174002', 'BUSINESS', 30, 30, 14999),
  
  -- AI204 (BOM-DEL Evening Return)
  ('123e4567-e89b-12d3-a456-426614174003', 'ECONOMY', 150, 150, 4999),
  ('123e4567-e89b-12d3-a456-426614174003', 'BUSINESS', 30, 30, 14999),

  -- AI301 (BLR-DEL Morning)
  ('123e4567-e89b-12d3-a456-426614174004', 'ECONOMY', 150, 150, 4999),
  ('123e4567-e89b-12d3-a456-426614174004', 'BUSINESS', 30, 30, 14999),
  
  -- AI302 (DEL-BLR Morning Return)
  ('123e4567-e89b-12d3-a456-426614174005', 'ECONOMY', 150, 150, 4999),
  ('123e4567-e89b-12d3-a456-426614174005', 'BUSINESS', 30, 30, 14999);

-- Insert next 3 days flights (April 2-4, 2025)
INSERT INTO flights (id, flight_number, origin, destination, departure_date, departure_time, arrival_date, arrival_time, aircraft_type)
VALUES
  -- April 2 Flights
  ('223e4567-e89b-12d3-a456-426614174000', 'AI201', 'DEL', 'BOM', '2025-04-02', '08:00:00', '2025-04-02', '10:00:00', 'Airbus A320'),
  ('223e4567-e89b-12d3-a456-426614174001', 'AI202', 'BOM', 'DEL', '2025-04-02', '11:30:00', '2025-04-02', '13:30:00', 'Airbus A320'),
  ('223e4567-e89b-12d3-a456-426614174002', 'AI301', 'BLR', 'DEL', '2025-04-02', '07:00:00', '2025-04-02', '09:30:00', 'Airbus A320'),
  ('223e4567-e89b-12d3-a456-426614174003', 'AI302', 'DEL', 'BLR', '2025-04-02', '10:30:00', '2025-04-02', '13:00:00', 'Airbus A320'),

  -- April 3 Flights
  ('323e4567-e89b-12d3-a456-426614174000', 'AI201', 'DEL', 'BOM', '2025-04-03', '08:00:00', '2025-04-03', '10:00:00', 'Airbus A320'),
  ('323e4567-e89b-12d3-a456-426614174001', 'AI202', 'BOM', 'DEL', '2025-04-03', '11:30:00', '2025-04-03', '13:30:00', 'Airbus A320'),
  ('323e4567-e89b-12d3-a456-426614174002', 'AI301', 'BLR', 'DEL', '2025-04-03', '07:00:00', '2025-04-03', '09:30:00', 'Airbus A320'),
  ('323e4567-e89b-12d3-a456-426614174003', 'AI302', 'DEL', 'BLR', '2025-04-03', '10:30:00', '2025-04-03', '13:00:00', 'Airbus A320'),

  -- April 4 Flights
  ('423e4567-e89b-12d3-a456-426614174000', 'AI201', 'DEL', 'BOM', '2025-04-04', '08:00:00', '2025-04-04', '10:00:00', 'Airbus A320'),
  ('423e4567-e89b-12d3-a456-426614174001', 'AI202', 'BOM', 'DEL', '2025-04-04', '11:30:00', '2025-04-04', '13:30:00', 'Airbus A320'),
  ('423e4567-e89b-12d3-a456-426614174002', 'AI301', 'BLR', 'DEL', '2025-04-04', '07:00:00', '2025-04-04', '09:30:00', 'Airbus A320'),
  ('423e4567-e89b-12d3-a456-426614174003', 'AI302', 'DEL', 'BLR', '2025-04-04', '10:30:00', '2025-04-04', '13:00:00', 'Airbus A320');

-- Insert cabin classes for next 3 days
INSERT INTO flight_cabin_classes (flight_id, cabin_class, total_seats, available_seats, price)
SELECT 
  id as flight_id,
  unnest(ARRAY['ECONOMY', 'BUSINESS']) as cabin_class,
  CASE 
    WHEN unnest(ARRAY['ECONOMY', 'BUSINESS']) = 'ECONOMY' THEN 150
    ELSE 30
  END as total_seats,
  CASE 
    WHEN unnest(ARRAY['ECONOMY', 'BUSINESS']) = 'ECONOMY' THEN 150
    ELSE 30
  END as available_seats,
  CASE 
    WHEN unnest(ARRAY['ECONOMY', 'BUSINESS']) = 'ECONOMY' THEN 4999
    ELSE 14999
  END as price
FROM flights
WHERE departure_date > '2025-04-01';
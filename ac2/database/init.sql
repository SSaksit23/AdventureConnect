CREATE TABLE IF NOT EXISTS locations (
    id SERIAL PRIMARY KEY,
    iata_code VARCHAR(3) UNIQUE,
    name VARCHAR(255) NOT NULL,
    city VARCHAR(100),
    country VARCHAR(100),
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8)
);

INSERT INTO locations (iata_code, name, city, country, latitude, longitude) VALUES
('MAD', 'Madrid-Barajas Airport', 'Madrid', 'Spain', 40.472219, -3.560833),
('BCN', 'Barcelona-El Prat Airport', 'Barcelona', 'Spain', 41.2971, 2.0785),
('LHR', 'Heathrow Airport', 'London', 'United Kingdom', 51.4706, -0.4619),
('CDG', 'Charles de Gaulle Airport', 'Paris', 'France', 49.0097, 2.5479),
('BKK', 'Suvarnabhumi Airport', 'Bangkok', 'Thailand', 13.6900, 100.7501),
('DXB', 'Dubai International Airport', 'Dubai', 'UAE', 25.2532, 55.3657),
('SIN', 'Singapore Changi Airport', 'Singapore', 'Singapore', 1.3644, 103.9915),
('JFK', 'John F. Kennedy International Airport', 'New York', 'USA', 40.6413, -73.7781),
('LAX', 'Los Angeles International Airport', 'Los Angeles', 'USA', 33.9425, -118.4081),
('NRT', 'Narita International Airport', 'Tokyo', 'Japan', 35.7647, 140.3864)
ON CONFLICT (iata_code) DO NOTHING;

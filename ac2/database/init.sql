-- Users table for authentication
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    date_of_birth DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- Locations for trips
CREATE TABLE IF NOT EXISTS locations (
    id SERIAL PRIMARY KEY,
    iata_code VARCHAR(3) UNIQUE,
    name VARCHAR(255) NOT NULL,
    city VARCHAR(100),
    country VARCHAR(100),
    country_code VARCHAR(2),
    location_type VARCHAR(20) DEFAULT 'airport',
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    timezone VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Categories for service listings
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    parent_id INTEGER REFERENCES categories(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Provider profiles (simplified for basic tour operator)
CREATE TABLE IF NOT EXISTS provider_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    business_name VARCHAR(255),
    business_type VARCHAR(100),
    verification_status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Service listings (tours, activities, etc.)
CREATE TABLE IF NOT EXISTS service_listings (
    id SERIAL PRIMARY KEY,
    provider_id INTEGER REFERENCES provider_profiles(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category_id INTEGER REFERENCES categories(id),
    base_price DECIMAL(10,2),
    currency VARCHAR(3) DEFAULT 'USD',
    status VARCHAR(20) DEFAULT 'draft',
    is_example_itinerary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Custom trips created by users
CREATE TABLE IF NOT EXISTS custom_trips (
    id SERIAL PRIMARY KEY,
    traveler_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_date DATE,
    end_date DATE,
    number_of_travelers INTEGER DEFAULT 1,
    total_price DECIMAL(10,2) DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'USD',
    status VARCHAR(20) DEFAULT 'draft',
    inspiration_source VARCHAR(20),
    inspiration_reference_id INTEGER,
    destinations TEXT,
    ai_image_url TEXT,
    ai_suggestion_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Components of custom trips (flights, hotels, activities, etc.)
CREATE TABLE IF NOT EXISTS trip_components (
    id SERIAL PRIMARY KEY,
    trip_id INTEGER REFERENCES custom_trips(id) ON DELETE CASCADE,
    component_type VARCHAR(20) NOT NULL,
    service_component_id INTEGER,
    listing_id INTEGER REFERENCES service_listings(id),
    external_provider VARCHAR(255),
    external_reference_id VARCHAR(255),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_date DATE,
    end_date DATE,
    start_time TIME,
    end_time TIME,
    location_id INTEGER REFERENCES locations(id),
    custom_location JSONB,
    price DECIMAL(10,2) DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'USD',
    status VARCHAR(20) DEFAULT 'planned',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Service components (for listings)
CREATE TABLE IF NOT EXISTS service_components (
    id SERIAL PRIMARY KEY,
    listing_id INTEGER REFERENCES service_listings(id) ON DELETE CASCADE,
    component_type VARCHAR(20) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2),
    currency VARCHAR(3) DEFAULT 'USD',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Enhanced bookings table
CREATE TABLE IF NOT EXISTS bookings (
    id SERIAL PRIMARY KEY,
    booking_reference VARCHAR(20) UNIQUE NOT NULL,
    traveler_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    custom_trip_id INTEGER REFERENCES custom_trips(id),
    listing_id INTEGER REFERENCES service_listings(id),
    start_date DATE,
    end_date DATE,
    number_of_travelers INTEGER DEFAULT 1,
    total_price DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    status VARCHAR(20) DEFAULT 'pending',
    special_requests TEXT,
    traveler_contact_info JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Booking components (for custom trip bookings)
CREATE TABLE IF NOT EXISTS booking_components (
    id SERIAL PRIMARY KEY,
    booking_id INTEGER REFERENCES bookings(id) ON DELETE CASCADE,
    component_id INTEGER REFERENCES trip_components(id),
    provider_id INTEGER REFERENCES provider_profiles(id),
    status VARCHAR(20) DEFAULT 'confirmed',
    price DECIMAL(10,2),
    currency VARCHAR(3) DEFAULT 'USD',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample locations
INSERT INTO locations (iata_code, name, city, country, country_code, location_type, latitude, longitude, timezone) VALUES
('MAD', 'Madrid-Barajas Airport', 'Madrid', 'Spain', 'ES', 'airport', 40.472219, -3.560833, 'Europe/Madrid'),
('BCN', 'Barcelona-El Prat Airport', 'Barcelona', 'Spain', 'ES', 'airport', 41.2971, 2.0785, 'Europe/Madrid'),
('LHR', 'Heathrow Airport', 'London', 'United Kingdom', 'GB', 'airport', 51.4706, -0.4619, 'Europe/London'),
('CDG', 'Charles de Gaulle Airport', 'Paris', 'France', 'FR', 'airport', 49.0097, 2.5479, 'Europe/Paris'),
('BKK', 'Suvarnabhumi Airport', 'Bangkok', 'Thailand', 'TH', 'airport', 13.6900, 100.7501, 'Asia/Bangkok'),
('DXB', 'Dubai International Airport', 'Dubai', 'UAE', 'AE', 'airport', 25.2532, 55.3657, 'Asia/Dubai'),
('SIN', 'Singapore Changi Airport', 'Singapore', 'Singapore', 'SG', 'airport', 1.3644, 103.9915, 'Asia/Singapore'),
('JFK', 'John F. Kennedy International Airport', 'New York', 'USA', 'US', 'airport', 40.6413, -73.7781, 'America/New_York'),
('LAX', 'Los Angeles International Airport', 'Los Angeles', 'USA', 'US', 'airport', 33.9425, -118.4081, 'America/Los_Angeles'),
('NRT', 'Narita International Airport', 'Tokyo', 'Japan', 'JP', 'airport', 35.7647, 140.3864, 'Asia/Tokyo')
ON CONFLICT (iata_code) DO NOTHING;

-- Insert sample categories
INSERT INTO categories (name, description) VALUES
('Tours & Activities', 'Guided tours and adventure activities'),
('Accommodation', 'Hotels, hostels, and other lodging options'),
('Transportation', 'Flights, trains, buses, and local transport'),
('Food & Dining', 'Restaurants, food tours, and culinary experiences'),
('Culture & History', 'Museums, historical sites, and cultural experiences'),
('Adventure Sports', 'Outdoor activities and extreme sports'),
('Wellness & Spa', 'Relaxation and wellness experiences')
ON CONFLICT DO NOTHING;

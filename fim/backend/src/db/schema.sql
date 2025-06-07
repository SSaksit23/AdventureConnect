-- Create flights table
CREATE TABLE IF NOT EXISTS flights (
    id SERIAL PRIMARY KEY,
    group_code VARCHAR(10) NOT NULL,
    pnr VARCHAR(10) NOT NULL,
    departure_date DATE NOT NULL,
    flight VARCHAR(10) NOT NULL,
    time TIME NOT NULL,
    route VARCHAR(100) NOT NULL,
    seats INTEGER NOT NULL,
    fare DECIMAL(10,2) NOT NULL,
    yq_tax DECIMAL(10,2) NOT NULL,
    total_fare DECIMAL(10,2) NOT NULL,
    deposit DECIMAL(10,2) NOT NULL,
    total_deposit DECIMAL(10,2) NOT NULL,
    push_to_market BOOLEAN DEFAULT false,
    deadline_1 DATE,
    deadline_2 DATE,
    issue_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_flights_pnr ON flights(pnr);
CREATE INDEX IF NOT EXISTS idx_flights_departure_date ON flights(departure_date);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_flights_updated_at
    BEFORE UPDATE ON flights
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 
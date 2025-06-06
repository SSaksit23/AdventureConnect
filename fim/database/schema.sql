-- Flight Inventory Management System Database Schema
-- Google Cloud SQL (MySQL/PostgreSQL)

-- Create database
CREATE DATABASE IF NOT EXISTS flight_inventory;
USE flight_inventory;

-- PNR Groups table (master table for bookings)
CREATE TABLE pnr_groups (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pnr VARCHAR(10) NOT NULL UNIQUE,
    group_code VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_pnr (pnr),
    INDEX idx_group_code (group_code)
);

-- Flights table (individual flight segments within PNRs)
CREATE TABLE flights (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pnr_id INT NOT NULL,
    flight_number VARCHAR(10) NOT NULL,
    departure_date DATE NOT NULL,
    route VARCHAR(20),
    time_schedule VARCHAR(20),
    seats INT NOT NULL DEFAULT 0,
    fare DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    yq_tax DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    deposit DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    push_to_market ENUM('Yes', 'No') DEFAULT 'Yes',
    flight_order INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (pnr_id) REFERENCES pnr_groups(id) ON DELETE CASCADE,
    INDEX idx_departure_date (departure_date),
    INDEX idx_flight_number (flight_number),
    INDEX idx_pnr_id (pnr_id)
);

-- Calculated deadline view (for first flight of each PNR)
CREATE VIEW pnr_deadlines AS
SELECT 
    pg.id as pnr_id,
    pg.pnr,
    pg.group_code,
    f.departure_date as first_departure,
    DATE_SUB(f.departure_date, INTERVAL 60 DAY) as deadline_1,
    DATE_SUB(f.departure_date, INTERVAL 30 DAY) as deadline_2,
    DATE_SUB(f.departure_date, INTERVAL 20 DAY) as issue_date
FROM pnr_groups pg
JOIN flights f ON pg.id = f.pnr_id
WHERE f.flight_order = 1;

-- Insert sample data
INSERT INTO pnr_groups (pnr, group_code) VALUES
('ABC123', 'CHNURC01'),
('DEF456', 'CHNURC02'),
('GHI789', 'EURSUM25'),
('JKL012', 'USWEST05'),
('MNO345', 'BKKJAP01'),
('PQR678', 'AUSDOWNU');

-- Insert sample flights
INSERT INTO flights (pnr_id, flight_number, departure_date, route, time_schedule, seats, fare, yq_tax, deposit, push_to_market, flight_order) VALUES
-- PNR ABC123 (CHNURC01)
(1, 'CZ3036', '2025-05-30', 'BKK-CAN', '03.00-07.00', 25, 8500.00, 1500.00, 2000.00, 'Yes', 1),
(1, 'CZ6900', '2025-05-30', 'CAN-URC', '09.05-14.15', 25, 9200.00, 1800.00, 2000.00, 'Yes', 2),
(1, 'CZ6881', '2025-06-06', 'URC-CAN', '16.45-21.55', 25, 8800.00, 1650.00, 2000.00, 'Yes', 3),
(1, 'CZ3035', '2025-06-06', 'CAN-BKK', '23.35-01.30+1', 25, 7500.00, 1400.00, 2000.00, 'Yes', 4),

-- PNR DEF456 (CHNURC02)
(2, 'CZ3036', '2025-06-02', 'BKK-CAN', '03.00-07.00', 30, 8500.00, 1500.00, 1800.00, 'No', 1),
(2, 'CZ6900', '2025-06-02', 'CAN-URC', '09.05-14.15', 30, 9200.00, 1800.00, 1800.00, 'No', 2),
(2, 'CZ6881', '2025-06-09', 'URC-CAN', '16.45-21.55', 30, 8800.00, 1650.00, 1800.00, 'No', 3),
(2, 'CZ3035', '2025-06-09', 'CAN-BKK', '23.35-01.30+1', 30, 7500.00, 1400.00, 1800.00, 'No', 4),

-- PNR GHI789 (EURSUM25)
(3, 'AF165', '2025-07-20', 'BKK-CDG', '11.30-17.45', 50, 12500.00, 3500.00, 3000.00, 'Yes', 1),
(3, 'LH773', '2025-07-22', 'CDG-FRA', '08.15-09.45', 50, 13000.00, 3800.00, 3000.00, 'Yes', 2),
(3, 'TG931', '2025-07-30', 'FRA-BKK', '22.15-13.45+1', 50, 14500.00, 4200.00, 3000.00, 'Yes', 3),

-- PNR JKL012 (USWEST05)
(4, 'UA838', '2025-09-01', 'BKK-LAX', '14.20-10.30+1', 15, 15000.00, 4500.00, 5000.00, 'Yes', 1),
(4, 'UA1205', '2025-09-02', 'LAX-SFO', '13.45-15.20', 15, 12000.00, 3200.00, 5000.00, 'Yes', 2),

-- PNR MNO345 (BKKJAP01)
(5, 'TG640', '2025-08-15', 'BKK-NRT', '09.00-17.30', 35, 8500.00, 2100.00, 2500.00, 'Yes', 1),
(5, 'NH850', '2025-08-22', 'NRT-BKK', '18.45-23.15', 35, 9200.00, 2300.00, 2500.00, 'Yes', 2),

-- PNR PQR678 (AUSDOWNU)
(6, 'QF24', '2025-10-05', 'BKK-SYD', '23.35-11.50+1', 40, 16500.00, 5200.00, 4000.00, 'No', 1),
(6, 'TG476', '2025-10-15', 'SYD-BKK', '13.20-18.45', 40, 17200.00, 5500.00, 4000.00, 'No', 2); 
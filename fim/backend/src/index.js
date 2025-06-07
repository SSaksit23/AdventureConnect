require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { Pool } = require('pg');

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Test database connection
pool.connect((err, client, release) => {
  if (err) {
    console.error('Error connecting to the database:', err);
    return;
  }
  console.log('Successfully connected to database');
  release();
});

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Flight inventory routes
app.get('/api/flights', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM flights ORDER BY departure_date');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching flights:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/flights', async (req, res) => {
  const { group_code, pnr, departure_date, flight, time, route, seats, fare, yq_tax, total_fare, deposit, total_deposit } = req.body;
  
  try {
    const result = await pool.query(
      `INSERT INTO flights (
        group_code, pnr, departure_date, flight, time, route, 
        seats, fare, yq_tax, total_fare, deposit, total_deposit
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
      [group_code, pnr, departure_date, flight, time, route, seats, fare, yq_tax, total_fare, deposit, total_deposit]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating flight:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
}); 
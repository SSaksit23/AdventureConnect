const mysql = require('mysql2/promise');

// Database configuration for Google Cloud SQL
const dbConfig = {
  host: process.env.DB_HOST || '/cloudsql/your-project:region:instance',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'flight_inventory',
  port: process.env.DB_PORT || 3306,
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true,
  charset: 'utf8mb4'
};

// For local development (when not on Google Cloud)
if (process.env.NODE_ENV === 'development') {
  dbConfig.host = process.env.DB_HOST || 'localhost';
}

// Create connection pool
const pool = mysql.createPool({
  ...dbConfig,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test database connection
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Database connected successfully');
    connection.release();
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }
}

// Initialize connection test
testConnection();

module.exports = pool; 
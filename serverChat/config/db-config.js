import 'dotenv/config';
import mysql from 'mysql2/promise';
// Create connection pool
// console.log(config.database.host, config.database.user, config.database.password, config.database.database);
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER ,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || "chat_bot_health_care",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // acquireTimeout: 60000,
  multipleStatements: true
});

// Initialize database tables
async function initDatabase() {
  try {
    const connection = await pool.getConnection();
    
    // URLs table
    await connection.execute(`
    CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        phone VARCHAR(15) UNIQUE NOT NULL,
        address VARCHAR(255) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP NULL,
        role VARCHAR(20) DEFAULT 'user',
        is_active BOOLEAN DEFAULT TRUE,
        INDEX idx_username (username),
        INDEX idx_email (email),
        INDEX idx_created_at (created_at)
    ) ENGINE=InnoDB
    `);


    connection.release();
    console.log('✅ Database tables initialized successfully');
  } catch (error) {
    console.error('❌ Database initialization error:', error);
    throw error;
  }
}

export { pool, initDatabase };
const { Pool } = require('pg');
require('dotenv').config({quiet: true});

// ============================================
// ENVIRONMENT VARIABLES VALIDATION
// ============================================
const requireEnvVars = ['DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'];
const missingVars = requireEnvVars.filter(varName => !process.env[varName]);
if(missingVars.length>0) {
  console.error(`Error: Missing required environment variables: ${missingVars.join(', ')}`);
  process.exit(1);
}

// ============================================
// POOL CONFIGURATION
// ============================================
const poolConfig = {
  host: process.env.DB_HOST,
  port:  process.env.DB_PORT || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 20, // Maximum connections in the pool
  idleTimeoutMillis: 30000, // Max idle time before closing a connection
  connectionTimeoutMillis: 30000, // Max time to establish a connection
  allowExitOnIdle: false // Prevents unexpected pool closures
};

// SSL only in production
if (process.env.NODE_ENV === 'production') {
  poolConfig.ssl = { rejectUnauthorized: false };
}

// ============================================
// CREATE THE POOL
// ============================================

const pool = new Pool(poolConfig);

// ============================================
// POOL ERROR HANDLING
// ============================================

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL error:', err);
});

pool.on('connect', () => {
  if (process.env.NODE_ENV === 'development') {
    console.log('New PostgreSQL connection established.');
  }
});

// ============================================
// EXPORT FUNCTIONS
// ============================================
module.exports = {
  query: (text, params) => pool.query(text, params),
  end: () => pool.end(),
  pool
};

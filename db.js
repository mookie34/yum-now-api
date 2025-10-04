const { Pool } = require('pg');
require('dotenv').config({quiet: true});

// ============================================
// VALIDACIÓN DE VARIABLES DE ENTORNO
// ============================================
const requireEnvVars = ['DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'];
const missingVars = requireEnvVars.filter(varName => !process.env[varName]);
if(missingVars.length>0) {
  console.error(`Error: Missing required environment variables: ${missingVars.join(', ')}`);
  process.exit(1);
}

// ============================================
// CONFIGURACIÓN DEl POOL
// ============================================
const poolConfig = {
  host: process.env.DB_HOST,
  port:  process.env.DB_PORT || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 20, // número máximo de conexiones en el pool
  idleTimeoutMillis: 30000, // tiempo máximo de inactividad antes de cerrar una conexión
  connectionTimeoutMillis: 30000 , // tiempo máximo para establecer una conexión
  allowExitOnIdle: false // ✅ Importante para evitar cierres inesperados
};

//SSL solo en producción
if (process.env.NODE_ENV === 'production') {
  poolConfig.ssl = { rejectUnauthorized: false };
}

// ============================================
// CREAR EL POOL
// ============================================

const pool = new Pool(poolConfig); 

// ============================================
// MANEJO DE ERRORES DEL POOL
// ============================================

pool.on('error', (err) => {
  console.error('❌ Error inesperado en PostgreSQL:', err);
});

pool.on('connect', () => {
  if (process.env.NODE_ENV === 'development') {
    console.log('✅ Nueva conexión con PostgreSQL');
  }
});

// ============================================
// EXPORTAR FUNCIONES
// ============================================
module.exports = {
  query: (text, params) => pool.query(text, params),
  end: () => pool.end(),
  pool
};

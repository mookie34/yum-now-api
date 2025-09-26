const pool = require('./db');

(async () => {
  try {
    const res = await pool.query('SELECT NOW()');
    console.log("✅ Conectado a Supabase:", res.rows[0]);
  } catch (err) {
    console.error("❌ Error de conexión:", err);
  } finally {
    pool.end();
  }
})();

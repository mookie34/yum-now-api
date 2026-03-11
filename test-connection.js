const pool = require('./db');

(async () => {
  try {
    const res = await pool.query('SELECT NOW()');
    console.log("Connected to database:", res.rows[0]);
  } catch (err) {
    console.error("Connection error:", err);
  } finally {
    pool.end();
  }
})();

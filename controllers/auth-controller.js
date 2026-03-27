const authService = require('../services/auth-service');
const { ValidationError, UnauthorizedError } = require('../errors/custom-errors');

const login = (req, res) => {
  try {
    const { username, password } = req.body;
    const token = authService.login(username, password);
    res.json({ token });
  } catch (err) {
    console.error('Error during login:', err.message);

    if (err instanceof ValidationError) {
      return res.status(400).json({ error: err.message });
    }

    if (err instanceof UnauthorizedError) {
      return res.status(401).json({ error: err.message });
    }

    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

module.exports = { login };

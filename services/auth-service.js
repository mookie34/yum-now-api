const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { ValidationError, UnauthorizedError } = require('../errors/custom-errors');

function login(username, password) {
  validateInput(username, password);
  validateCredentials(username, password);
  return generateToken(username);
}

function validateInput(username, password) {
  if (!username || !password) {
    throw new ValidationError('Usuario y contraseña son requeridos');
  }
}

function validateCredentials(username, password) {
  const isUsernameValid = timingSafeCompare(username, process.env.ADMIN_USERNAME);
  const isPasswordValid = timingSafeCompare(password, process.env.ADMIN_PASSWORD);

  if (!isUsernameValid || !isPasswordValid) {
    throw new UnauthorizedError('Credenciales incorrectas');
  }
}

function timingSafeCompare(a, b) {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));

  if (bufA.length !== bufB.length) return false;

  return crypto.timingSafeEqual(bufA, bufB);
}

function generateToken(username) {
  return jwt.sign({ username }, process.env.JWT_SECRET, { expiresIn: '8h' });
}

module.exports = { login };

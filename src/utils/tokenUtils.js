const jwt = require('jsonwebtoken');
const config = require('../config/config');

const generateToken = (userId, role) => {
  return jwt.sign(
    { id: userId, role },
    config.jwt.secret,
    { expiresIn: config.jwt.expire }
  );
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, config.jwt.secret);
  } catch (error) {
    return null;
  }
};

const generateRefreshToken = (userId) => {
  return jwt.sign(
    { id: userId },
    config.jwt.refreshTokenSecret,
    { expiresIn: '30d' }
  );
};

module.exports = {
  generateToken,
  verifyToken,
  generateRefreshToken,
};

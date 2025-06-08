// backend/middleware/auth.js
const jwt = require('jsonwebtoken');
const { userModel, providerProfileModel } = require('../models/database');
const winston = require('winston');

// Configure logger for this middleware
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }), // log stack trace
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: 'auth-middleware' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    new winston.transports.File({ filename: 'logs/auth-error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/auth.log' })
  ]
});

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (token == null) {
    logger.warn('Authentication token required but not provided.', { path: req.path });
    return res.status(401).json({ message: 'Authentication token required.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key_adventure_connect');
    
    const user = await userModel.findById(decoded.userId);
    if (!user) {
      logger.warn(`User not found for token. User ID: ${decoded.userId}`, { path: req.path });
      return res.status(403).json({ message: 'User not found for this token.' });
    }
    
    req.user = user; // Attach user object to request (contains id, email, role, etc.)
    logger.info(`User authenticated: ${user.email} (ID: ${user.id})`, { path: req.path });
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      logger.warn('Token expired.', { error: err.message, path: req.path });
      return res.status(401).json({ message: 'Token expired. Please log in again.' });
    }
    if (err.name === 'JsonWebTokenError') {
      logger.warn('Invalid token.', { error: err.message, path: req.path });
      return res.status(403).json({ message: 'Invalid token.' });
    }
    logger.error("Token verification failed.", { error: err.message, stack: err.stack, path: req.path });
    return res.status(403).json({ message: 'Token verification failed.', error: err.message });
  }
};

const isProvider = (req, res, next) => {
  if (!req.user) {
    logger.error('isProvider middleware called without authenticated user.', { path: req.path });
    return res.status(500).json({ message: 'User not authenticated for role check.' });
  }
  if (req.user.role === 'service_provider' || req.user.role === 'influencer') {
    logger.info(`User ${req.user.email} authorized as provider/influencer.`, { path: req.path });
    next();
  } else {
    logger.warn(`User ${req.user.email} (Role: ${req.user.role}) attempted provider action without permission.`, { path: req.path });
    return res.status(403).json({ message: 'Access denied. Provider role required.' });
  }
};

const isVerifiedProvider = async (req, res, next) => {
  if (!req.user) {
    logger.error('isVerifiedProvider middleware called without authenticated user.', { path: req.path });
    return res.status(500).json({ message: 'User not authenticated for verification check.' });
  }

  if (req.user.role !== 'service_provider' && req.user.role !== 'influencer') {
    logger.warn(`User ${req.user.email} (Role: ${req.user.role}) attempted verified provider action without provider role.`, { path: req.path });
    return res.status(403).json({ message: 'Access denied. Provider role required.' });
  }

  try {
    const providerProfile = await providerProfileModel.findByUserId(req.user.id);
    if (!providerProfile) {
      logger.warn(`Provider profile not found for user ${req.user.email} (ID: ${req.user.id}).`, { path: req.path });
      return res.status(403).json({ message: 'Provider profile not found. Please complete your provider setup.' });
    }

    if (providerProfile.verification_status === 'verified') {
      logger.info(`User ${req.user.email} authorized as verified provider.`, { path: req.path });
      req.providerProfile = providerProfile; // Attach provider profile to request
      next();
    } else {
      logger.warn(`User ${req.user.email} attempted action requiring verified provider status, but status is ${providerProfile.verification_status}.`, { path: req.path });
      return res.status(403).json({ message: `Access denied. Provider account not verified. Current status: ${providerProfile.verification_status}.` });
    }
  } catch (err) {
    logger.error('Error checking provider verification status.', { userId: req.user.id, error: err.message, stack: err.stack, path: req.path });
    return res.status(500).json({ message: 'Failed to check provider verification status.' });
  }
};

const isAdmin = (req, res, next) => {
  if (!req.user) {
    logger.error('isAdmin middleware called without authenticated user.', { path: req.path });
    return res.status(500).json({ message: 'User not authenticated for admin check.' });
  }
  if (req.user.role === 'admin') {
    logger.info(`User ${req.user.email} authorized as admin.`, { path: req.path });
    next();
  } else {
    logger.warn(`User ${req.user.email} (Role: ${req.user.role}) attempted admin action without permission.`, { path: req.path });
    return res.status(403).json({ message: 'Access denied. Administrator role required.' });
  }
};

// Generic role check middleware if needed for more complex scenarios
const hasRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      logger.error('hasRole middleware called without authenticated user.', { path: req.path });
      return res.status(500).json({ message: 'User not authenticated for role check.' });
    }
    if (!roles.includes(req.user.role)) {
      logger.warn(`User ${req.user.email} (Role: ${req.user.role}) attempted action requiring one of roles: [${roles.join(', ')}].`, { path: req.path });
      return res.status(403).json({ message: `Access denied. Required roles: ${roles.join(' or ')}.` });
    }
    logger.info(`User ${req.user.email} authorized with role ${req.user.role} (Required: [${roles.join(', ')}]).`, { path: req.path });
    next();
  };
};

module.exports = {
  authenticateToken,
  isProvider,
  isVerifiedProvider,
  isAdmin,
  hasRole
};

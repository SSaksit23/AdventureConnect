const { getAuth } = require('../config/firebase');

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: {
          message: 'No valid authorization token provided',
          status: 401
        }
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Verify the Firebase ID token
    const decodedToken = await getAuth().verifyIdToken(token);
    
    // Add user info to request object
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      name: decodedToken.name || decodedToken.email,
      emailVerified: decodedToken.email_verified
    };
    
    console.log(`✅ Authenticated user: ${req.user.email}`);
    next();
    
  } catch (error) {
    console.error('❌ Authentication error:', error);
    
    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({
        error: {
          message: 'Token expired. Please log in again.',
          status: 401,
          code: 'TOKEN_EXPIRED'
        }
      });
    }
    
    if (error.code === 'auth/argument-error') {
      return res.status(401).json({
        error: {
          message: 'Invalid token format',
          status: 401,
          code: 'INVALID_TOKEN'
        }
      });
    }
    
    return res.status(401).json({
      error: {
        message: 'Invalid or expired token',
        status: 401,
        code: 'AUTHENTICATION_FAILED'
      }
    });
  }
};

// Optional middleware for routes that work with or without authentication
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decodedToken = await getAuth().verifyIdToken(token);
      
      req.user = {
        uid: decodedToken.uid,
        email: decodedToken.email,
        name: decodedToken.name || decodedToken.email,
        emailVerified: decodedToken.email_verified
      };
    }
    
    next();
  } catch (error) {
    // If token verification fails, continue without user
    console.log('Optional auth failed, continuing without user');
    next();
  }
};

module.exports = {
  authenticateToken,
  optionalAuth
}; 
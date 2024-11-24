const jwt = require('jsonwebtoken');

const adminAuth = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1] || 
                 req.cookies?.adminToken;
    
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    try {
      const decoded = jwt.verify(token, process.env.ADMIN_SECRET_KEY, {
        algorithms: ['HS512']
      });
      
      if (!decoded.isAdmin || decoded.email !== process.env.ADMIN_EMAIL) {
        return res.status(403).json({ message: 'Not authorized as admin' });
      }

      req.admin = decoded;
      next();
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Session expired' });
      }
      throw jwtError;
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ message: 'Invalid authentication' });
  }
};

module.exports = adminAuth; 
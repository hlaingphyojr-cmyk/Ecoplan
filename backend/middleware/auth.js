const jwt = require('jsonwebtoken');
const User = require('../models/User');

function signToken(user) {
  return jwt.sign({ sub: user._id.toString() }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

function authRequired(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Authentication required' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = payload.sub;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

async function adminRequired(req, res, next) {
  authRequired(req, res, async () => {
    try {
      const user = await User.findById(req.userId);
      if (!user) return res.status(401).json({ error: 'User not found' });
      if (user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
      req.user = user;
      next();
    } catch (err) {
      next(err);
    }
  });
}

module.exports = { signToken, authRequired, adminRequired };
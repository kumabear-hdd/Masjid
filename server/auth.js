const jwt = require('jsonwebtoken');

const COOKIE_NAME = 'masjid_admin_token';

function getSecret() {
  return process.env.SESSION_SECRET || 'dev-secret-change-me';
}

function signToken(admin) {
  return jwt.sign(
    { id: admin.id, email: admin.email, name: admin.name },
    getSecret(),
    { expiresIn: '8h' }
  );
}

function setAuthCookie(res, token) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 8 * 60 * 60 * 1000,
  });
}

function clearAuthCookie(res) {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });
}

function requireAuth(req, res, next) {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    req.admin = jwt.verify(token, getSecret());
    return next();
  } catch {
    clearAuthCookie(res);
    return res.status(401).json({ error: 'Unauthorized' });
  }
}

module.exports = {
  COOKIE_NAME,
  signToken,
  setAuthCookie,
  clearAuthCookie,
  requireAuth,
};

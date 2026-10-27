import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export const COOKIE_NAME = 'ca_token';

export function signToken(userId) {
  return jwt.sign({ sub: userId }, env.jwtSecret, { expiresIn: '7d' });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, env.jwtSecret);
  } catch {
    return null;
  }
}

export function setAuthCookie(res, token) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true, // not readable from JS -> protects against XSS token theft
    sameSite: 'lax',
    secure: env.isProd,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

/** Express middleware: require a valid session cookie. */
export function requireAuth(req, res, next) {
  const payload = verifyToken(req.cookies?.[COOKIE_NAME]);
  if (!payload) return res.status(401).json({ message: 'Not authenticated' });
  req.userId = payload.sub;
  next();
}

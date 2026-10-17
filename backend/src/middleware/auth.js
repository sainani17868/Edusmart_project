/**
 * @module middleware/auth
 * @description JWT-based authentication and role-authorization middleware.
 */

import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { config } from '../config/env.js';

// ─── Token Extraction Helper ──────────────────────────────────────────────────

/**
 * Extract JWT from Authorization header (Bearer token) or cookie.
 * @param {import('express').Request} req
 * @returns {string|null}
 */
const extractToken = (req) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }
  if (req.cookies?.token) {
    return req.cookies.token;
  }
  return null;
};

// ─── Protect Middleware ───────────────────────────────────────────────────────

/**
 * Protect route: verifies JWT and attaches the decoded user to req.user.
 * Responds with 401 if no valid token is present.
 *
 * @type {import('express').RequestHandler}
 */
export const protect = async (req, res, next) => {
  const token = extractToken(req);

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required. Please log in to access this resource.',
    });
  }

  try {
    const decoded = jwt.verify(token, config.JWT_SECRET);

    // Fetch fresh user from DB (ensures deleted/deactivated users can't access)
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'The user belonging to this token no longer exists.',
      });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Your session has expired. Please log in again.',
      });
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid authentication token. Please log in again.',
      });
    }

    next(err);
  }
};

// ─── Admin-Only Middleware ────────────────────────────────────────────────────

/**
 * Restrict access to admin-role users only.
 * Must be used AFTER `protect` middleware.
 *
 * @type {import('express').RequestHandler}
 */
export const adminOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required.',
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges are required for this action.',
    });
  }

  next();
};

// ─── Optional Auth Middleware ─────────────────────────────────────────────────

/**
 * Optional authentication: attaches req.user if a valid token is provided,
 * but does NOT fail the request if no token is present.
 * Useful for routes with mixed public/private content.
 *
 * @type {import('express').RequestHandler}
 */
export const optionalAuth = async (req, res, next) => {
  const token = extractToken(req);

  if (!token) {
    return next(); // No token — continue as unauthenticated
  }

  try {
    const decoded = jwt.verify(token, config.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (user) {
      req.user = user;
    }
  } catch {
    // Invalid or expired token in optional mode — silently ignore
  }

  next();
};

/**
 * EduSmart – Authentication API Functions
 *
 * All functions use the shared axios instance which automatically:
 *  - Injects Authorization headers
 *  - Handles 401 redirects
 *
 * Functions return the full axios response so callers can access
 * both `data` and response metadata.
 */

import api from './axios';

/* ----------------------------------------------------------------
   Endpoints
   ---------------------------------------------------------------- */
const AUTH_BASE = '/api/auth';

/* ----------------------------------------------------------------
   loginUser
   POST /api/auth/login
   Body: { email, password }
   Returns: { token, user }
   ---------------------------------------------------------------- */
export async function loginUser(email, password) {
  const response = await api.post(`${AUTH_BASE}/login`, {
    email: email.trim().toLowerCase(),
    password,
  });
  return response.data;
}

/* ----------------------------------------------------------------
   registerUser
   POST /api/auth/register
   Body: { name, email, password, ...optional }
   Returns: { token, user }
   ---------------------------------------------------------------- */
export async function registerUser(name, email, password, extra = {}) {
  const response = await api.post(`${AUTH_BASE}/register`, {
    name: name.trim(),
    email: email.trim().toLowerCase(),
    password,
    ...extra,
  });
  return response.data;
}

/* ----------------------------------------------------------------
   getMe
   GET /api/auth/me
   Returns the currently authenticated user's profile.
   ---------------------------------------------------------------- */
export async function getMe() {
  const response = await api.get(`${AUTH_BASE}/me`);
  return response.data;
}

/* ----------------------------------------------------------------
   updateMe
   PUT /api/auth/me
   Body: partial user object { name?, email?, avatar?, ... }
   Returns: { user }
   ---------------------------------------------------------------- */
export async function updateMe(profileData) {
  const response = await api.put(`${AUTH_BASE}/me`, profileData);
  return response.data;
}

/* ----------------------------------------------------------------
   changePassword
   PUT /api/auth/password
   Body: { currentPassword, newPassword }
   ---------------------------------------------------------------- */
export async function changePassword(currentPassword, newPassword) {
  const response = await api.put(`${AUTH_BASE}/password`, {
    currentPassword,
    newPassword,
  });
  return response.data;
}

/* ----------------------------------------------------------------
   logoutUser
   POST /api/auth/logout
   Invalidates the token server-side (if the server supports it).
   ---------------------------------------------------------------- */
export async function logoutUser() {
  const response = await api.post(`${AUTH_BASE}/logout`);
  return response.data;
}

/* ----------------------------------------------------------------
   requestPasswordReset
   POST /api/auth/forgot-password
   Body: { email }
   ---------------------------------------------------------------- */
export async function requestPasswordReset(email) {
  const response = await api.post(`${AUTH_BASE}/forgot-password`, {
    email: email.trim().toLowerCase(),
  });
  return response.data;
}

/* ----------------------------------------------------------------
   resetPassword
   POST /api/auth/reset-password
   Body: { token, newPassword }
   ---------------------------------------------------------------- */
export async function resetPassword(resetToken, newPassword) {
  const response = await api.post(`${AUTH_BASE}/reset-password`, {
    token: resetToken,
    newPassword,
  });
  return response.data;
}

/* ----------------------------------------------------------------
   refreshAuthToken
   POST /api/auth/refresh
   Returns: { token }
   ---------------------------------------------------------------- */
export async function refreshAuthToken() {
  const response = await api.post(`${AUTH_BASE}/refresh`);
  return response.data;
}

/* ----------------------------------------------------------------
   verifyEmail
   POST /api/auth/verify-email
   Body: { token }
   ---------------------------------------------------------------- */
export async function verifyEmail(verificationToken) {
  const response = await api.post(`${AUTH_BASE}/verify-email`, {
    token: verificationToken,
  });
  return response.data;
}

/**
 * EduSmart – Axios Instance
 *
 * Centralised HTTP client configuration:
 *  - Base URL resolved from VITE_API_URL env variable
 *  - Request interceptor injects Authorization: Bearer <token>
 *  - Response interceptor handles 401 (clears auth, redirects to /login)
 *  - Sensible timeout & default headers
 */

import axios from 'axios';

/* ----------------------------------------------------------------
   Constants
   ---------------------------------------------------------------- */
const TOKEN_KEY   = 'edusmart_token';
const USER_KEY    = 'edusmart_user';
const REQUEST_TIMEOUT_MS = 30_000; // 30 seconds

/* ----------------------------------------------------------------
   Create axios instance
   ---------------------------------------------------------------- */
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  timeout: REQUEST_TIMEOUT_MS,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  withCredentials: false, // set to true if using HTTP-only cookie sessions
});

/* ----------------------------------------------------------------
   Request interceptor – attach token to every outgoing request
   ---------------------------------------------------------------- */
axiosInstance.interceptors.request.use(
  (config) => {
    // Always read from localStorage so we pick up the latest token
    // even if the axios default header hasn't been updated yet.
    const token = localStorage.getItem(TOKEN_KEY);

    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    // Attach a request timestamp for latency measurement (optional)
    config.metadata = { startTime: Date.now() };

    return config;
  },
  (error) => {
    // Request setup failed before it was sent
    return Promise.reject(error);
  }
);

/* ----------------------------------------------------------------
   Response interceptor – handle global error cases
   ---------------------------------------------------------------- */

// Track whether a redirect is already in progress to prevent loops
let isRedirecting = false;

axiosInstance.interceptors.response.use(
  (response) => {
    // Attach response latency for debugging (optional)
    if (response.config?.metadata?.startTime) {
      response.latencyMs = Date.now() - response.config.metadata.startTime;
    }
    return response;
  },
  (error) => {
    const status  = error?.response?.status;
    const config  = error?.config || {};

    /* -------- 401 Unauthorized – token expired / invalid -------- */
    if (status === 401) {
      // Skip auth endpoints to prevent an infinite redirect loop
      const isAuthEndpoint =
        config.url?.includes('/api/auth/login') ||
        config.url?.includes('/api/auth/register') ||
        config.url?.includes('/api/auth/refresh');

      if (!isAuthEndpoint && !isRedirecting) {
        isRedirecting = true;

        // Clear stored credentials
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);

        // Remove default header
        delete axiosInstance.defaults.headers.common['Authorization'];

        // Redirect to login page – preserve current path so user can
        // be sent back after successful re-authentication.
        const currentPath = window.location.pathname + window.location.search;
        const redirectUrl  =
          currentPath !== '/login'
            ? `/login?redirect=${encodeURIComponent(currentPath)}`
            : '/login';

        window.location.href = redirectUrl;

        // Reset flag after navigation completes
        setTimeout(() => { isRedirecting = false; }, 3000);
      }
    }

    /* -------- 403 Forbidden – insufficient permissions ----------- */
    if (status === 403) {
      // Could dispatch a global notification here
      console.warn('[EduSmart] Access denied:', config.url);
    }

    /* -------- 500+ Server errors --------------------------------- */
    if (status >= 500) {
      console.error('[EduSmart] Server error:', status, config.url);
    }

    /* -------- Network / timeout errors --------------------------- */
    if (error.code === 'ECONNABORTED') {
      console.warn('[EduSmart] Request timed out:', config.url);
    }

    if (!error.response && error.message === 'Network Error') {
      console.warn('[EduSmart] Network unavailable. Request failed:', config.url);
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;

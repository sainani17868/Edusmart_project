/**
 * EduSmart – Authentication Context
 *
 * Provides global authentication state and operations:
 *  - login / register / logout / updateUser
 *  - Persists JWT in localStorage
 *  - Injects Authorization header into all axios requests
 *  - Validates stored token on mount via /api/auth/me
 *  - Handles token expiry gracefully (clears state + redirects)
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import axios from '../api/axios';

/* ----------------------------------------------------------------
   Context definition
   ---------------------------------------------------------------- */
const AuthContext = createContext(null);

/* ----------------------------------------------------------------
   localStorage helpers
   ---------------------------------------------------------------- */
const TOKEN_KEY = 'edusmart_token';
const USER_KEY  = 'edusmart_user';

function persistToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    localStorage.removeItem(TOKEN_KEY);
    delete axios.defaults.headers.common['Authorization'];
  }
}

function persistUser(user) {
  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(USER_KEY);
  }
}

function loadStoredToken() {
  return localStorage.getItem(TOKEN_KEY) || null;
}

function loadStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/* ----------------------------------------------------------------
   AuthProvider
   ---------------------------------------------------------------- */
export function AuthProvider({ children }) {
  const [user,            setUser]            = useState(loadStoredUser);
  const [token,           setToken]           = useState(loadStoredToken);
  const [isLoading,       setIsLoading]       = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Ref prevents a second "validate on mount" if component re-renders quickly
  const validationRan = useRef(false);

  /* ------------------------------------------------------------------
     Initialise axios header from stored token immediately (synchronous)
     so the very first request (validateToken) already carries the header.
  ------------------------------------------------------------------ */
  useEffect(() => {
    const storedToken = loadStoredToken();
    if (storedToken) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
    }
  }, []);

  /* ------------------------------------------------------------------
     clearAuth – wipes all auth state & storage
  ------------------------------------------------------------------ */
  const clearAuth = useCallback(() => {
    setUser(null);
    setToken(null);
    setIsAuthenticated(false);
    persistToken(null);
    persistUser(null);
  }, []);

  /* ------------------------------------------------------------------
     validateToken – called on mount to confirm stored token is still
     valid with the backend.  If the server returns 401 the axios
     response interceptor calls clearAuth automatically; we just need
     to set isLoading = false regardless of outcome.
  ------------------------------------------------------------------ */
  const validateToken = useCallback(async () => {
    const storedToken = loadStoredToken();

    if (!storedToken) {
      setIsLoading(false);
      return;
    }

    try {
      const { data } = await axios.get('/api/auth/me');
      const userData = data.user ?? data;

      setUser(userData);
      setToken(storedToken);
      setIsAuthenticated(true);
      persistUser(userData);
    } catch (error) {
      // 401 → interceptor has already called clearAuth
      // Any other error (network outage, etc.) — keep stored data to
      // allow offline access, but mark as unauthenticated to be safe.
      const status = error?.response?.status;
      if (status === 401 || status === 403) {
        clearAuth();
      } else {
        // Non-auth error: honour local state so UX isn't disrupted
        const storedUser = loadStoredUser();
        if (storedUser) {
          setUser(storedUser);
          setIsAuthenticated(true);
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, [clearAuth]);

  /* ------------------------------------------------------------------
     Mount effect – validate token once
  ------------------------------------------------------------------ */
  useEffect(() => {
    if (validationRan.current) return;
    validationRan.current = true;
    validateToken();
  }, [validateToken]);

  /* ------------------------------------------------------------------
     login(email, password) → { success, error? }
  ------------------------------------------------------------------ */
  const login = useCallback(async (email, password) => {
    try {
      setIsLoading(true);

      const { data } = await axios.post('/api/auth/login', { email, password });

      const receivedToken = data.token;
      const userData      = data.user ?? data;

      persistToken(receivedToken);
      persistUser(userData);

      setToken(receivedToken);
      setUser(userData);
      setIsAuthenticated(true);

      return { success: true, user: userData };
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error   ||
        'Login failed. Please check your credentials.';

      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  /* ------------------------------------------------------------------
     register(userData) → { success, error? }
  ------------------------------------------------------------------ */
  const register = useCallback(async (userData) => {
    try {
      setIsLoading(true);

      const { data } = await axios.post('/api/auth/register', userData);

      const receivedToken = data.token;
      const newUser       = data.user ?? data;

      persistToken(receivedToken);
      persistUser(newUser);

      setToken(receivedToken);
      setUser(newUser);
      setIsAuthenticated(true);

      return { success: true, user: newUser };
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error   ||
        'Registration failed. Please try again.';

      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  /* ------------------------------------------------------------------
     logout() – invalidates the token server-side then clears local state
  ------------------------------------------------------------------ */
  const logout = useCallback(async () => {
    try {
      // Best-effort: inform server (fire-and-forget)
      await axios.post('/api/auth/logout');
    } catch {
      // Ignore – we clear local state regardless
    } finally {
      clearAuth();
    }
  }, [clearAuth]);

  /* ------------------------------------------------------------------
     updateUser(partialData) – merge profile updates into current user
  ------------------------------------------------------------------ */
  const updateUser = useCallback(async (partialData) => {
    try {
      const { data } = await axios.put('/api/auth/me', partialData);
      const updatedUser = data.user ?? data;

      setUser(updatedUser);
      persistUser(updatedUser);

      return { success: true, user: updatedUser };
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error   ||
        'Failed to update profile.';

      return { success: false, error: message };
    }
  }, []);

  /* ------------------------------------------------------------------
     refreshToken – silently refresh JWT (if endpoint supported)
  ------------------------------------------------------------------ */
  const refreshToken = useCallback(async () => {
    try {
      const { data } = await axios.post('/api/auth/refresh');
      const newToken = data.token;

      persistToken(newToken);
      setToken(newToken);

      return { success: true };
    } catch {
      clearAuth();
      return { success: false };
    }
  }, [clearAuth]);

  /* ------------------------------------------------------------------
     Memoised context value – avoids needless re-renders for consumers
  ------------------------------------------------------------------ */
  const contextValue = useMemo(
    () => ({
      // State
      user,
      token,
      isLoading,
      isAuthenticated,

      // Derived helpers
      isAdmin: user?.role === 'admin',

      // Actions
      login,
      register,
      logout,
      updateUser,
      refreshToken,
      clearAuth,
    }),
    [
      user,
      token,
      isLoading,
      isAuthenticated,
      login,
      register,
      logout,
      updateUser,
      refreshToken,
      clearAuth,
    ]
  );

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

/* ----------------------------------------------------------------
   useAuth – convenience hook with guard
   ---------------------------------------------------------------- */
export function useAuth() {
  const context = useContext(AuthContext);

  if (context === null) {
    throw new Error(
      'useAuth must be used within an <AuthProvider>. ' +
      'Ensure your component tree is wrapped with <AuthProvider>.'
    );
  }

  return context;
}

export default AuthContext;

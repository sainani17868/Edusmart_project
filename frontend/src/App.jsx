/**
 * EduSmart – Root Application Component
 *
 * Sets up React Router v6 routes with auth-protected routes.
 * The entire tree is wrapped in AuthProvider for global auth state.
 */

import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';

/* ----------------------------------------------------------------
   Page imports – lazy-loaded for code splitting & faster initial load
   ---------------------------------------------------------------- */
const HomePage         = lazy(() => import('./pages/HomePage'));
const LoginPage        = lazy(() => import('./pages/LoginPage'));
const RegisterPage     = lazy(() => import('./pages/RegisterPage'));
const DashboardPage    = lazy(() => import('./pages/DashboardPage'));
const CoursesPage      = lazy(() => import('./pages/CoursesPage'));
const QuizPage         = lazy(() => import('./pages/QuizPage'));
const QuizResultsPage  = lazy(() => import('./pages/QuizResultsPage'));
const AdminDashboard   = lazy(() => import('./pages/AdminDashboard'));
const ProfilePage      = lazy(() => import('./pages/ProfilePage'));
const NotFoundPage     = lazy(() => import('./pages/NotFoundPage'));

/* ----------------------------------------------------------------
   Full-screen loading fallback shown while lazy chunks load
   ---------------------------------------------------------------- */
function PageLoader() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        flexDirection: 'column',
        gap: '16px',
        background: 'var(--color-bg)',
      }}
    >
      <div className="spinner spinner-lg" role="status" aria-label="Loading page" />
      <p className="loading-text">Loading EduSmart…</p>
    </div>
  );
}

/* ----------------------------------------------------------------
   App – root component
   ---------------------------------------------------------------- */
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* ── Public routes ── */}
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* ── Semi-public (viewable without login) ── */}
            <Route path="/courses" element={<CoursesPage />} />

            {/* ── Protected routes (authenticated users) ── */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/quiz/:quizId"
              element={
                <ProtectedRoute>
                  <QuizPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/quiz/:quizId/results"
              element={
                <ProtectedRoute>
                  <QuizResultsPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />

            {/* ── Admin-only protected route ── */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute adminOnly>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />

            {/* ── Legacy redirects ── */}
            <Route path="/home" element={<Navigate to="/" replace />} />

            {/* ── 404 catch-all ── */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}

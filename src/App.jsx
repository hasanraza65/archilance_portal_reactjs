// src/App.jsx
import React, { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

// ✅ Lazy load all page components for performance optimization
// Dashboard pages (protected)
const Dashboard = lazy(() => import("./pages/dashboard"));
const Ecommerce = lazy(() => import("./pages/dashboard/ecommerce"));

// ✅ Auth pages (public)
const Login = lazy(() => import("./pages/auth/login"));
const Register = lazy(() => import("./pages/auth/register")); // ✅ Add Register page
const ForgotPass = lazy(() => import("./pages/auth/forgot-password"));

// ✅ 404 error page
const Error = lazy(() => import("./pages/404"));

// ✅ Layouts (these are loaded eagerly, not lazy)
import Layout from "./layout/Layout";
import AuthLayout from "./layout/AuthLayout";

// ✅ Components
import Loading from "@/components/Loading";
import ProtectedRoute from "./ProtectedRoute";

function App() {
  return (
    <main className="App relative">
      <Routes>

        {/* ✅ Public routes login, register, forgot-password */}
        <Route element={<AuthLayout />}>
          <Route
            path="/"
            element={
              <Suspense fallback={<Loading />}>
                <Login />
              </Suspense>
            }
          />

          {/* Redirect /login to root login page */}
          <Route path="login" element={<Navigate to="/" replace />} />
          <Route
            path="register"
            element={
              <Suspense fallback={<Loading />}>
                <Register />
              </Suspense>
            }
          />

          {/* Forgot password route */}
          <Route
            path="forgot-password"
            element={
              <Suspense fallback={<Loading />}>
                <ForgotPass />
              </Suspense>
            }
          />
        </Route>

        {/* ✅ Protected routes (after login only) */}
        <Route element={<ProtectedRoute />}>

          {/* ✅ Common layout for all protected pages */}
          <Route element={<Layout />}>

            {/* Dashboard route */}
            <Route
              path="dashboard"
              element={
                <Suspense fallback={<Loading />}>
                  <Dashboard />
                </Suspense>
              }
            />

            {/* Ecommerce route */}
            <Route
              path="ecommerce"
              element={
                <Suspense fallback={<Loading />}>
                  <Ecommerce />
                </Suspense>
              }
            />

            {/* Catch-all route for unmatched protected paths */}
            <Route path="*" element={<Navigate to="/404" replace />} />
          </Route>
        </Route>

        {/* ✅ 404 error page route */}
        <Route
          path="/404"
          element={
            <Suspense fallback={<Loading />}>
              <Error />
            </Suspense>
          }
        />

        {/* ✅ Catch-all for unmatched public paths */}
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </main>
  );
}

export default App;

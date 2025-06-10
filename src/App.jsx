// src/App.jsx

import React, { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify"; // <<<---- IMPORT THIS
import "react-toastify/dist/ReactToastify.css"; // <<<---- And its CSS

// Layouts
import Layout from "./layout/Layout";
import AuthLayout from "./layout/AuthLayout";

// Components
import Loading from "@/components/Loading";
import ProtectedRoute from "./ProtectedRoute";

// Pages
const Dashboard = lazy(() => import("./pages/dashboard"));
const Ecommerce = lazy(() => import("./pages/dashboard/ecommerce"));
const Login = lazy(() => import("./pages/auth/login"));
const Register = lazy(() => import("./pages/auth/register"));
const ForgotPass = lazy(() => import("./pages/auth/forgot-password"));
const Profile = lazy(() => import("./pages/utility/profile"));
const EditProfile = lazy(() => import("./pages/utility/edit-profile"));
const ProjectPostPage = lazy(() => import("./pages/app/projects"));
const ProjectDetailsPage = lazy(() =>
  import("./pages/app/projects/project-details")
);
const Allemployees = lazy(() => import("./pages/employees/AllEmployees"));
const AddEmployee = lazy(() => import("./pages/employees/AddEmployees"));
const AllCustomers = lazy(() => import("./pages/customers/AllCustomers"));
const AddCustomers = lazy(() => import("./pages/customers/AddCustomers"));
const CustomerView = lazy(() => import("./pages/customers/ViewCustomer"));
const UpdateCustomer = lazy(() => import("./pages/customers/UpdateCustomer"));
const ShowEmployee = lazy(() => import("./pages/employees/ShowEmployee"));
const EditEmployee = lazy(() => import("./pages/employees/UpdateEmployee"));
const TaskDetailsPage = lazy(() =>
  import("./pages/app/projects/Task/TaskDetailsPage")
);
const KanbanPage = lazy(() => import("./pages/app/projects/kanban"));
const ProjectBriefDetailPage = lazy(() =>
  import("./pages/app/projects/Brief-task/ProjectBriefDetailPage")
);
const Error = lazy(() => import("./pages/404"));

function App() {
  return (
    <main className="App relative">
     
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />

      <Routes>
        {/* Authentication Routes (Public) */}
        <Route element={<AuthLayout />}>
          <Route
            path="/"
            element={
              <Suspense fallback={<Loading />}>
                <Login />
              </Suspense>
            }
          />
          <Route path="login" element={<Navigate to="/" replace />} />
          <Route
            path="register"
            element={
              <Suspense fallback={<Loading />}>
                <Register />
              </Suspense>
            }
          />
          <Route
            path="forgot-password"
            element={
              <Suspense fallback={<Loading />}>
                <ForgotPass />
              </Suspense>
            }
          />
        </Route>

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route
              path="dashboard"
              element={
                <Suspense fallback={<Loading />}>
                  <Dashboard />
                </Suspense>
              }
            />
            <Route
              path="ecommerce"
              element={
                <Suspense fallback={<Loading />}>
                  <Ecommerce />
                </Suspense>
              }
            />
            <Route
              path="profile"
              element={
                <Suspense fallback={<Loading />}>
                  <Profile />
                </Suspense>
              }
            />
            <Route
              path="profile/edit"
              element={
                <Suspense fallback={<Loading />}>
                  <EditProfile />
                </Suspense>
              }
            />
            <Route path="projects" element={<ProjectPostPage />} />
            <Route path="projects/:id" element={<ProjectDetailsPage />} />
            <Route path="/task/:taskId" element={<TaskDetailsPage />} />
            <Route path="/project/:id/kanban" element={<KanbanPage />} />
            <Route
              path="/project-brief/:briefId"
              element={<ProjectBriefDetailPage />}
            />

            {/* Employees Routes */}
            <Route path="employees" element={<Allemployees />} />
            <Route
              path="/employees/view/:employeeId"
              element={<ShowEmployee />}
            />
            <Route path="employees/add" element={<AddEmployee />} />
            <Route
              path="/employees/edit/:employeeId"
              element={<EditEmployee />}
            />

            {/* Customer Route */}
            <Route path="customers" element={<AllCustomers />} />
            <Route
              path="/customers/view/:customerId"
              element={<CustomerView />}
            />
            <Route path="customers/add" element={<AddCustomers />} />
            <Route
              path="/customers/edit/:customerId"
              element={<UpdateCustomer />}
            />

            {/* Fallback for protected routes */}
            <Route path="*" element={<Navigate to="/404" replace />} />
          </Route>
        </Route>

        {/* 404 Error Page */}
        <Route
          path="/404"
          element={
            <Suspense fallback={<Loading />}>
              <Error />
            </Suspense>
          }
        />
        {/* Global Fallback */}
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </main>
  );
}

export default App;

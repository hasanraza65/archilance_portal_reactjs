import React, { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

const Dashboard = lazy(() => import("./pages/dashboard"));
const Ecommerce = lazy(() => import("./pages/dashboard/ecommerce"));
const Login = lazy(() => import("./pages/auth/login"));
const Register = lazy(() => import("./pages/auth/register"));
const ForgotPass = lazy(() => import("./pages/auth/forgot-password"));
const Profile = lazy(() => import("./pages/utility/profile"));
const EditProfile = lazy(() => import("./pages/utility/edit-profile"));
const ProjectPostPage = lazy(() => import("./pages/app/projects"));


// Error page link
const Error = lazy(() => import("./pages/404"));

import Layout from "./layout/Layout";
import AuthLayout from "./layout/AuthLayout";

import Loading from "@/components/Loading";
import ProtectedRoute from "./ProtectedRoute";
import ProjectDetailsPage from "./pages/app/projects/project-details";
import Allemployees from "./pages/employees/AllEmployees";
import AddEmployee from "./pages/employees/AddEmployees";
import AllCustomers from "./pages/customers/AllCustomers";
import AddCustomers from "./pages/customers/AddCustomers";
import CustomerView from "./pages/customers/ViewCustomer";
import UpdateCustomer from "./pages/customers/UpdateCustomer";
import ShowEmployee from "./pages/employees/ShowEmployee";
import EditEmployee from "./pages/employees/UpdateEmployee";
import TaskDetailsPage from "./pages/app/projects/Task/TaskDetailsPage";

import KanbanPage from "./pages/app/projects/kanban";

function App() {
  return (
    <main className="App relative">
      <Routes>
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
              path="profile/edit" // New route for editing profile
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
         

             {/* Employees Routes */}
             <Route path="employees" element={<Allemployees />} />
             <Route path="/employees/view/:employeeId" element={<ShowEmployee />} />
             <Route path="employees/add" element={<AddEmployee />} />
             <Route path="/employees/edit/:employeeId" element={<EditEmployee />} />


              {/* Customer Route */}
              <Route path="customers" element={<AllCustomers />} />
               <Route path="/customers/view/:customerId" element={<CustomerView />} />
              <Route path="customers/add" element={<AddCustomers />} />
              <Route path="/customers/edit/:customerId" element={<UpdateCustomer />} />



            {/* Error Page Route */}
            <Route path="*" element={<Navigate to="/404" replace />} />
          </Route>
        </Route>

        <Route
          path="/404"
          element={
            <Suspense fallback={<Loading />}>
              <Error />
            </Suspense>
          }
        />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </main>
  );
}

export default App;

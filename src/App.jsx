// src/App.jsx

import React, { lazy, Suspense, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useSelector, useDispatch } from "react-redux";

// Our new central socket service
import { connectSocket, disconnectSocket } from "./socket";

// Layouts
import Layout from "./layout/Layout";
import AuthLayout from "./layout/AuthLayout";

// Components
import Loading from "@/components/Loading";
import ProtectedRoute from "./ProtectedRoute";
import ChatPage from "./pages/app/chat";
import WorkSession from "./pages/employees/WorkSession/WorkSession";
import AdminEmployeeWorkSession from "./pages/employees/WorkSession/AdminEmployeeWorkSession";
import OrderDetailsPage from "./pages/customers/OrderPage/OrderDetailPage";
import Subscription from "./pages/customers/Subscription/Subscription";
import UpgradePlan from "./pages/customers/Subscription/UpgradePlan";
import Checkout from "./pages/customers/Subscription/Checkout";
import WorkDiaryPage from "./pages/customers/WorkDiaryPage/WorkDiaryPage";
import CustomerKanbanPage from "./pages/customers/CustomerKanbanPage/CustomerKanbanPage";
import EmployeeDashboard from "./pages/employees/Leave/EmployeeDashboard";
import LeaveManagementPage from "./pages/AdminLeave/LeaveManagementPage";
import PaymentStatusPage from "./pages/customers/Subscription/PaymentMethod";

// Pages (lazy loaded)
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
  const loggedInUser = useSelector((state) => state.auth.user);
  const dispatch = useDispatch();

  useEffect(() => {
    if (loggedInUser) {
      connectSocket(dispatch, loggedInUser.id);
    }
    return () => {
      disconnectSocket();
    };
  }, [loggedInUser, dispatch]);

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
            <Route path="leaves" element={<LeaveManagementPage />} />
            <Route
              path="/project-brief/:briefId"
              element={<ProjectBriefDetailPage />}
            />
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
            <Route path="work-session" element={<WorkSession />} />
            <Route
              path="/employees/work-sessions/:employeeId"
              element={<AdminEmployeeWorkSession />}
            />
            <Route path="employeeleaves" element={<EmployeeDashboard />} />
            {/* --- Customers Routes --- */}
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
            
            {/* =================================================================== */}
            <Route
              path="/customer/order-details/:id"
              element={<OrderDetailsPage />}
            />
            <Route path="/work-diary/:projectId" element={<WorkDiaryPage />} />
            <Route path="/kanban/:projectId" element={<CustomerKanbanPage />} />
            {/* =================================================================== */}
              
            <Route path="subscriptions" element={<Subscription />} />
            <Route path="/upgrade-plan" element={<UpgradePlan />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/payment-status" element={<PaymentStatusPage />} />


            <Route path="chat" element={<ChatPage />} />
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
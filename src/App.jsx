import React, { lazy, Suspense, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useSelector, useDispatch } from "react-redux";
import { connectSocket, disconnectSocket } from "./socket";

// ++ YAHAN BREADCRUMB PROVIDER KO IMPORT KIYA GAYA HAI ++
import { BreadcrumbProvider } from "./components/ui/BreadcrumbsContext"; 

import Layout from "./layout/Layout";
import AuthLayout from "./layout/AuthLayout";
import Loading from "@/components/Loading";
import ProtectedRoute from "./ProtectedRoute";
import AdminSubscription from "./pages/admin/AdminSubscription";
import CustomerTeam from "./pages/customers/CustomerTeam/CustomerTeam";
import MyTeamAccess from "./pages/member/MyTeamAccess";
import AllCustomerTeam from "./pages/admin/AllCustomerTeam";
import AddCustomerTeam from "./pages/customers/CustomerTeam/AddCustomerTeam";
import EditCustomerTeam from "./pages/customers/CustomerTeam/EditCustomerTeam";

const ChatPage = lazy(() => import("./pages/app/chat"));
const WorkSession = lazy(() => import("./pages/employees/WorkSession/WorkSession"));
const AdminEmployeeWorkSession = lazy(() => import("./pages/employees/WorkSession/AdminEmployeeWorkSession"));
const OrderDetailsPage = lazy(() => import("./pages/customers/OrderPage/OrderDetailPage"));
const Subscription = lazy(() => import("./pages/customers/Subscription/Subscription"));
const UpgradePlan = lazy(() => import("./pages/customers/Subscription/UpgradePlan"));
const Checkout = lazy(() => import("./pages/customers/Subscription/Checkout"));
const WorkDiaryPage = lazy(() => import("./pages/customers/WorkDiaryPage/WorkDiaryPage"));
const CustomerKanbanPage = lazy(() => import("./pages/customers/CustomerKanbanPage/CustomerKanbanPage"));
const EmployeeDashboard = lazy(() => import("./pages/employees/Leave/EmployeeDashboard"));
const LeaveManagementPage = lazy(() => import("./pages/AdminLeave/LeaveManagementPage"));
const PaymentStatusPage = lazy(() => import("./pages/customers/Subscription/PaymentMethod"));
const Dashboard = lazy(() => import("./pages/dashboard"));
const Ecommerce = lazy(() => import("./pages/dashboard/ecommerce"));
const Login = lazy(() => import("./pages/auth/login"));
const ForgotPass = lazy(() => import("./pages/auth/forgot-password"));
const Profile = lazy(() => import("./pages/utility/profile"));
const EditProfile = lazy(() => import("./pages/utility/edit-profile"));
const ProjectPostPage = lazy(() => import("./pages/app/projects"));
const ProjectDetailsPage = lazy(() => import("./pages/app/projects/project-details"));
const Allemployees = lazy(() => import("./pages/employees/AllEmployees"));
const AddEmployee = lazy(() => import("./pages/employees/AddEmployees"));
const AllCustomers = lazy(() => import("./pages/customers/AllCustomers"));
const AddCustomers = lazy(() => import("./pages/customers/AddCustomers"));
const CustomerView = lazy(() => import("./pages/customers/ViewCustomer"));
const UpdateCustomer = lazy(() => import("./pages/customers/UpdateCustomer"));
const ShowEmployee = lazy(() => import("./pages/employees/ShowEmployee"));
const EditEmployee = lazy(() => import("./pages/employees/UpdateEmployee"));
const TaskDetailsPage = lazy(() => import("./pages/app/projects/Task/TaskDetailsPage"));
const KanbanPage = lazy(() => import("./pages/app/projects/kanban"));
const ProjectBriefDetailPage = lazy(() => import("./pages/app/projects/Brief-task/ProjectBriefDetailPage"));
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

      {/* ++ POORI APPLICATION KO BREADCRUMBPROVIDER SE WRAP KIYA GAYA HAI ++ */}
      <BreadcrumbProvider>
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
              path="forgot-password"
              element={
                <Suspense fallback={<Loading />}>
                  <ForgotPass />
                </Suspense>
              }
            />
          </Route>

          <Route element={<Layout />}>
            <Route
              path="dashboard"
              element={
                <ProtectedRoute allowedRoles={["admin", "customer","member"]}>
                  <Suspense fallback={<Loading />}>
                    <Dashboard />
                  </Suspense>
                </ProtectedRoute>
              }
            />
            <Route
              path="ecommerce"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <Suspense fallback={<Loading />}>
                    <Ecommerce />
                  </Suspense>
                </ProtectedRoute>
              }
            />
            <Route
              path="profile"
              element={
                <ProtectedRoute allowedRoles={["admin", "employee", "customer","member"]}>
                  <Suspense fallback={<Loading />}>
                    <Profile />
                  </Suspense>
                </ProtectedRoute>
              }
            />
            <Route
              path="profile/edit"
              element={
                <ProtectedRoute allowedRoles={["admin", "employee", "customer","member"]}>
                  <Suspense fallback={<Loading />}>
                    <EditProfile />
                  </Suspense>
                </ProtectedRoute>
              }
            />
            <Route
              path="subscription"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <Suspense fallback={<Loading />}>
                    <AdminSubscription />
                  </Suspense>
                </ProtectedRoute>
              }
            />
            <Route
              path="jobs"
              element={
                <ProtectedRoute allowedRoles={["admin", "employee", "customer","member", "outsource","manager"]}>
                  <ProjectPostPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="jobs/:id"
              element={
                <ProtectedRoute allowedRoles={["admin", "employee", "customer","member", "manager","outsource"]}>
                  <ProjectDetailsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/project/:taskId"
              element={
                <ProtectedRoute allowedRoles={["admin", "employee", "customer","member","manager", "outsource"]}>
                  <TaskDetailsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/job/:id/kanban"
              element={
                <ProtectedRoute allowedRoles={["admin", "employee","member", "outsource","manager"]}>
                  <KanbanPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/job-brief/:briefId"
              element={
                <ProtectedRoute allowedRoles={["admin", "employee", "customer","member","manager", "outsource"]}>
                  <ProjectBriefDetailPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="leaves"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <LeaveManagementPage />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="employees"
              element={
                <ProtectedRoute requireManagerAccess={true} >
                  <Allemployees />
                </ProtectedRoute>
              }
            />
            <Route
              path="/employees/view/:employeeId"
              element={
                <ProtectedRoute requireManagerAccess={true}>
                  <ShowEmployee />
                </ProtectedRoute>
              }
            />
            <Route
              path="employees/add"
              element={
                <ProtectedRoute requireManagerAccess={true}>
                  <AddEmployee />
                </ProtectedRoute>
              }
            />
            <Route
              path="/employees/edit/:employeeId"
              element={
                <ProtectedRoute requireManagerAccess={true}>
                  <EditEmployee />
                </ProtectedRoute>
              }
            />
            <Route
              path="/employees/work-sessions/:employeeId"
              element={
                <ProtectedRoute requireManagerAccess={true}>
                  <AdminEmployeeWorkSession />
                </ProtectedRoute>
              }
            />

            <Route
              path="work-session"
              element={
                <ProtectedRoute allowedRoles={["employee", "outsource","manager"]}>
                  <WorkSession />
                </ProtectedRoute>
              }
            />
            <Route
              path="employeeleaves"
              element={
                <ProtectedRoute allowedRoles={["employee","manager","outsource"]}>
                  <EmployeeDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="customers"
              element={
                <ProtectedRoute requireManagerAccess={true}>
                  <AllCustomers />
                </ProtectedRoute>
              }
            />
            <Route
              path="/customers/view/:customerId"
              element={
                <ProtectedRoute requireManagerAccess={true}>
                  <CustomerView />
                </ProtectedRoute>
              }
            />
            <Route
              path="customers/add"
              element={
                <ProtectedRoute requireManagerAccess={true}>
                  <AddCustomers />
                </ProtectedRoute>
              }
            />
            <Route
              path="/customers/edit/:customerId"
              element={
                 <ProtectedRoute requireManagerAccess={true}>
                  <UpdateCustomer />
                </ProtectedRoute>
              }
            />

            <Route
              path="/order-details/:id"
              element={
                <ProtectedRoute allowedRoles={["customer","member"]}>
                  <OrderDetailsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/work-diary/:projectId"
              element={
                <ProtectedRoute allowedRoles={["customer"]}>
                  <WorkDiaryPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/kanban/:projectId"
              element={
                <ProtectedRoute allowedRoles={["customer"]}>
                  <CustomerKanbanPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="subscriptions"
              element={
                <ProtectedRoute allowedRoles={["customer"]}>
                  <Subscription />
                </ProtectedRoute>
              }
            />
            <Route
              path="/upgrade-plan"
              element={
                <ProtectedRoute allowedRoles={["customer"]}>
                  <UpgradePlan />
                </ProtectedRoute>
              }
            />
            <Route
              path="/checkout"
              element={
                <ProtectedRoute allowedRoles={["customer"]}>
                  <Checkout />
                </ProtectedRoute>
              }
            />
            <Route
              path="/payment-status"
              element={
                <ProtectedRoute allowedRoles={["customer"]}>
                  <PaymentStatusPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="chat"
              element={
                <ProtectedRoute allowedRoles={["admin", "employee", "outsource","manager"]}>
                  <ChatPage />
                </ProtectedRoute>
              }
            />
         
               <Route
              path="team"
              element={
                <ProtectedRoute allowedRoles={["customer"]}>
                  <CustomerTeam />
                </ProtectedRoute>
              }
            />
              <Route
              path="team/add"
              element={
                <ProtectedRoute allowedRoles={["customer"]}>
                  <AddCustomerTeam />
                </ProtectedRoute>
              }
            />
          
              <Route
              path="team/edit/:id"
              element={
                <ProtectedRoute allowedRoles={["customer"]}>
                  <EditCustomerTeam/>
                </ProtectedRoute>
              }
            />
            <Route
              path="teamaccess"
              element={
                <ProtectedRoute allowedRoles={["member"]}>
                  <MyTeamAccess />
                </ProtectedRoute>
              }
            />
            <Route
              path="customerteam"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AllCustomerTeam />
                </ProtectedRoute>
              }
            />
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
      </BreadcrumbProvider>
    </main>
  );
}

export default App;
import React, { useState, useEffect } from "react";
import Card from "@/components/ui/Card";
import HomeBredCurbs from "./HomeBredCurbs";
import { useAuth } from "@/context/AuthContext";

// Simple stat card component
const StatCard = ({ item, color }) => (
  <div
    className={`p-6 rounded-xl ${color.bg} hover:shadow-lg transition-shadow duration-200`}
  >
    <div className="flex items-center justify-between mb-3">
      <div
        className={`w-10 h-10 rounded-lg ${color.iconBg} flex items-center justify-center`}
      >
        <div className={`w-5 h-5 ${color.icon}`}>{item.icon}</div>
      </div>
    </div>
    <h4 className={`${color.title} text-sm font-medium mb-1`}>{item.title}</h4>
    <div className={`${color.count} text-2xl font-bold`}>{item.count}</div>
  </div>
);

// Icon Components
const UserIcon = () => (
  <svg fill="currentColor" viewBox="0 0 20 20" className="w-full h-full">
    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
  </svg>
);
const BriefcaseIcon = () => (
  <svg fill="currentColor" viewBox="0 0 20 20" className="w-full h-full">
    <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h2zm4-3a1 1 0 00-1 1v1h2V4a1 1 0 00-1-1z" clipRule="evenodd" />
  </svg>
);
const FolderIcon = () => (
  <svg fill="currentColor" viewBox="0 0 20 20" className="w-full h-full">
    <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
  </svg>
);
const TaskIcon = () => (
  <svg fill="currentColor" viewBox="0 0 20 20" className="w-full h-full">
    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
  </svg>
);
const ClockIcon = () => (
  <svg fill="currentColor" viewBox="0 0 20 20" className="w-full h-full">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
  </svg>
);
const CheckIcon = () => (
  <svg fill="currentColor" viewBox="0 0 20 20" className="w-full h-full">
    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
  </svg>
);

// Stats grid component
const StatsGrid = ({ stats, colors }) => (
  <div className="grid xl:grid-cols-4 lg:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-6">
    {stats.map((item, i) => (
      <StatCard
        key={i}
        item={item}
        color={colors[i % colors.length]}
      />
    ))}
  </div>
);

const Dashboard = () => {
  const { user, token } = useAuth();
  
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const cardColors = [
    { bg: "bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800", title: "text-blue-700 dark:text-blue-300", count: "text-blue-900 dark:text-blue-100", icon: "text-blue-600 dark:text-blue-400", iconBg: "bg-blue-100 dark:bg-blue-800/30", },
    { bg: "bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800", title: "text-orange-700 dark:text-orange-300", count: "text-orange-900 dark:text-orange-100", icon: "text-orange-600 dark:text-orange-400", iconBg: "bg-orange-100 dark:bg-orange-800/30", },
    { bg: "bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800", title: "text-emerald-700 dark:text-emerald-300", count: "text-emerald-900 dark:text-emerald-100", icon: "text-emerald-600 dark:text-emerald-400", iconBg: "bg-emerald-100 dark:bg-emerald-800/30", },
    { bg: "bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800", title: "text-purple-700 dark:text-purple-300", count: "text-purple-900 dark:text-purple-100", icon: "text-purple-600 dark:text-purple-400", iconBg: "bg-purple-100 dark:bg-purple-800/30", },
  ];

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user || !token) {
        setLoading(false);
        return;
      }

      let apiUrl = "";
      if (user.role === "admin") {
        apiUrl = "https://demo.aentora.com/backend/public/api/admin/dashboard";
      } else if (user.role === "customer") {
        apiUrl = "https://demo.aentora.com/backend/public/api/customer/dashboard";
      } else {
        setLoading(false);
        return;
      }
      
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(apiUrl, {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        // ** THIS WILL SHOW THE FULL API DATA IN THE BROWSER CONSOLE **
        console.log("Full API Response for role '" + user.role + "':", data);

        let transformedStats = [];
        if (user.role === "admin") {
          transformedStats = [
            { title: "Total Customers", count: data.total_customers, icon: <UserIcon /> },
            { title: "Total Employees", count: data.total_employees, icon: <BriefcaseIcon /> },
            { title: "Total Projects", count: data.total_projects, icon: <FolderIcon /> },
            { title: "Projects In Progress", count: data.total_in_progress_projects, icon: <TaskIcon /> },
            { title: "Completed Projects", count: data.total_completed_projects, icon: <CheckIcon /> },
            { title: "Total Users", count: data.total_users, icon: <UserIcon /> },
          ];
        } else if (user.role === "customer") {
            transformedStats = [
              { title: "My Total Projects", count: data.total_projects, icon: <FolderIcon /> },
              { title: "Projects In Progress", count: data.total_in_progress_projects, icon: <ClockIcon /> },
              { title: "Completed Projects", count: data.total_completed_projects, icon: <CheckIcon /> },
            ];
        }
        setStats(transformedStats);
      } catch (e) {
        setError(e.message);
        console.error("Failed to fetch dashboard data:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user, token]);

  const getDashboardTitle = () => {
    if (user?.role === 'admin') return 'Admin Overview';
    if (user?.role === 'customer') return 'My Workspace';
    return 'Dashboard';
  }

  return (
    <div>
      <HomeBredCurbs title="Dashboard" />

      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-1">
          Welcome back, {user?.name || "User"}!
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {user?.role === "admin"
            ? "Here's your business overview."
            : "Here's an overview of your projects and tasks."}
        </p>
      </div>

      <div className="grid grid-cols-12 gap-5 mb-5">
        <div className="col-span-12">
          <Card bodyClass="p-6">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-6">
              {getDashboardTitle()}
            </h2>
            {loading && (
              <div className="text-center p-4">Loading dashboard data...</div>
            )}
            {error && (
              <div className="text-center p-4 text-red-500">
                Failed to load data: {error}
              </div>
            )}
            {!loading && !error && stats.length > 0 && (
              <StatsGrid stats={stats} colors={cardColors} />
            )}
             {!loading && !error && stats.length === 0 && (
              <div className="text-center p-4 text-gray-500">
                No dashboard data available for your role.
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
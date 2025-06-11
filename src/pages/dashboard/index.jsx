import React, { useState } from "react";
import Card from "@/components/ui/Card";
import GroupChart1 from "@/components/partials/widget/chart/group-chart-1";
import HomeBredCurbs from "./HomeBredCurbs";
import { useAuth } from "@/context/AuthContext";

// Simple stat card component
const StatCard = ({ item, color, index }) => (
  <div
    className={`p-6 rounded-xl ${color.bg} hover:shadow-lg transition-shadow duration-200`}
  >
    <div className="flex items-center justify-between mb-3">
      <div
        className={`w-10 h-10 rounded-lg ${color.iconBg} flex items-center justify-center`}
      >
        <div className={`w-5 h-5 ${color.icon}`}>{item.icon}</div>
      </div>
      {item.change && (
        <span
          className={`text-xs font-medium px-2 py-1 rounded-full ${
            item.change > 0
              ? "bg-green-100 text-green-600"
              : "bg-red-100 text-red-600"
          }`}
        >
          {item.change > 0 ? "+" : ""}
          {item.change}%
        </span>
      )}
    </div>

    <h4 className={`${color.title} text-sm font-medium mb-1`}>{item.title}</h4>
    <div className={`${color.count} text-2xl font-bold`}>{item.count}</div>
  </div>
);

// Simple icons
const UserIcon = () => (
  <svg fill="currentColor" viewBox="0 0 20 20" className="w-full h-full">
    <path
      fillRule="evenodd"
      d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
      clipRule="evenodd"
    />
  </svg>
);

const BriefcaseIcon = () => (
  <svg fill="currentColor" viewBox="0 0 20 20" className="w-full h-full">
    <path
      fillRule="evenodd"
      d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h2zm4-3a1 1 0 00-1 1v1h2V4a1 1 0 00-1-1z"
      clipRule="evenodd"
    />
  </svg>
);

const FolderIcon = () => (
  <svg fill="currentColor" viewBox="0 0 20 20" className="w-full h-full">
    <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
  </svg>
);

const TaskIcon = () => (
  <svg fill="currentColor" viewBox="0 0 20 20" className="w-full h-full">
    <path
      fillRule="evenodd"
      d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
      clipRule="evenodd"
    />
  </svg>
);

const ClockIcon = () => (
  <svg fill="currentColor" viewBox="0 0 20 20" className="w-full h-full">
    <path
      fillRule="evenodd"
      d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
      clipRule="evenodd"
    />
  </svg>
);

const CheckIcon = () => (
  <svg fill="currentColor" viewBox="0 0 20 20" className="w-full h-full">
    <path
      fillRule="evenodd"
      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
      clipRule="evenodd"
    />
  </svg>
);

// Stats grid component
const StatsGrid = ({ stats, colors }) => (
  <div className="grid xl:grid-cols-4 lg:grid-cols-2 grid-cols-1 gap-6">
    {stats.map((item, i) => (
      <StatCard
        key={i}
        item={item}
        color={colors[i % colors.length]}
        index={i}
      />
    ))}
  </div>
);

const Dashboard = () => {
  const { user } = useAuth();

  // Admin stats with icons
  const adminStats = [
    {
      title: "Total Customers",
      count: "1,247",
      change: 12.5,
      icon: <UserIcon />,
    },
    {
      title: "Active Employees",
      count: "45",
      change: 8.2,
      icon: <BriefcaseIcon />,
    },
    {
      title: "Running Projects",
      count: "125",
      change: -2.1,
      icon: <FolderIcon />,
    },
    {
      title: "Pending Tasks",
      count: "420",
      change: 15.8,
      icon: <TaskIcon />,
    },
  ];

  // Employee stats
  const employeeStats = [
    {
      title: "My Projects",
      count: "7",
      change: 16.7,
      icon: <FolderIcon />,
    },
    {
      title: "Pending Tasks",
      count: "15",
      change: -5.3,
      icon: <ClockIcon />,
    },
    {
      title: "In Progress",
      count: "3",
      change: 25.0,
      icon: <TaskIcon />,
    },
    {
      title: "Completed",
      count: "28",
      change: 33.3,
      icon: <CheckIcon />,
    },
  ];

  // Clean color palette
  const cardColors = [
    {
      bg: "bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800",
      title: "text-blue-700 dark:text-blue-300",
      count: "text-blue-900 dark:text-blue-100",
      icon: "text-blue-600 dark:text-blue-400",
      iconBg: "bg-blue-100 dark:bg-blue-800/30",
    },
    {
      bg: "bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800",
      title: "text-orange-700 dark:text-orange-300",
      count: "text-orange-900 dark:text-orange-100",
      icon: "text-orange-600 dark:text-orange-400",
      iconBg: "bg-orange-100 dark:bg-orange-800/30",
    },
    {
      bg: "bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800",
      title: "text-emerald-700 dark:text-emerald-300",
      count: "text-emerald-900 dark:text-emerald-100",
      icon: "text-emerald-600 dark:text-emerald-400",
      iconBg: "bg-emerald-100 dark:bg-emerald-800/30",
    },
    {
      bg: "bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800",
      title: "text-purple-700 dark:text-purple-300",
      count: "text-purple-900 dark:text-purple-100",
      icon: "text-purple-600 dark:text-purple-400",
      iconBg: "bg-purple-100 dark:bg-purple-800/30",
    },
  ];

  return (
    <div>
      <HomeBredCurbs title="Dashboard" />

      {/* Simple welcome message */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-1">
          Welcome back, {user?.name || "User"}!
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {user?.role === "admin"
            ? "Here's your business overview"
            : "Track your tasks and projects"}
        </p>
      </div>

      <div className="grid grid-cols-12 gap-5 mb-5">
        <div className="col-span-12">
          <Card bodyClass="p-6">
            {user?.role === "admin" ? (
              <div>
                <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-6">
                  Admin Overview
                </h2>
                <StatsGrid stats={adminStats} colors={cardColors} />
              </div>
            ) : user?.role === "employee" ? (
              <div>
                <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-6">
                  My Workspace
                </h2>
                <StatsGrid stats={employeeStats} colors={cardColors} />
              </div>
            ) : (
              <div className="grid md:grid-cols-3 col-span-1 gap-4">
                <GroupChart1 />
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

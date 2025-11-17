import React from "react";
import Dropdown from "@/components/ui/Dropdown";
import Icon from "@/components/ui/Icon";
import { Link } from "react-router-dom"; 
import { MenuItem } from "@headlessui/react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import Cookies from "js-cookie";
import { formatDistanceToNow } from "date-fns";
import Loading from "@/components/Loading";

import DefaultUserImage from "@/assets/images/users/user-1.jpg";


const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_BASE_URL;
const NOTIFICATIONS_API_URL = `${BACKEND_BASE_URL}/api/my-notifications`;

const fetchNotifications = async () => {
  const token = Cookies.get("token");
  if (!token) {
    throw new Error("No authentication token found.");
  }
  const response = await axios.get(NOTIFICATIONS_API_URL, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });
  return response.data;
};

const formatNotificationType = (type = "") => {
  if (!type) return "Notification";
  return type
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const getNotificationStyles = (nature) => {
  switch (nature) {
    case "success":
      return "bg-success-500/10 border-l-2 border-success-500"; 
    case "warning":
      return "bg-warning-500/10 border-l-2 border-warning-500"; 
    case "error":
      return "bg-danger-500/10 border-l-2 border-danger-500";
    default:
      return "border-l-2 border-transparent";
  }
};

const getNotificationLink = (notification) => {
  const { notification_type, project_id, task_id } = notification;

  if (notification_type && notification_type.includes("task_")) {
    if (task_id) {
      return `/project/${task_id}`; 
    }
  }

  if (notification_type && notification_type.includes("project_")) {
    if (project_id) {
      return `/jobs/${project_id}`;
    }
  }

  return "#"; 
};


const NotifyLabel = ({ unreadCount }) => {
  return (
    <span className="relative lg:h-[32px] lg:w-[32px] lg:bg-slate-100 text-slate-900 lg:dark:bg-slate-900 dark:text-white cursor-pointer rounded-full text-[20px] flex flex-col items-center justify-center">
      <Icon icon="heroicons-outline:bell" className="animate-tada" />
      {unreadCount > 0 && (
        <span className="absolute lg:right-0 lg:top-0 -top-2 -right-2 h-4 w-4 bg-red-500 text-[8px] font-semibold flex flex-col items-center justify-center rounded-full text-white z-99">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </span>
  );
};

// Main Notification component
const Notification = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["notifications"],
    queryFn: fetchNotifications,
  });

  const notifications = data?.notifications?.data || [];
  const unreadCount = data?.total_unread || 0;

  return (
    <Dropdown
      classMenuItems="md:w-[300px] top-[58px]"
      label={<NotifyLabel unreadCount={unreadCount} />}
    >
      <div className="flex justify-between px-4 py-4 border-b border-slate-100 dark:border-slate-600">
        <h4 className="text-sm font-medium text-slate-800 dark:text-slate-200">
          Notifications
        </h4>
        <span className="text-xs font-normal text-slate-500 dark:text-slate-400 cursor-pointer">
          Mark all as read
        </span>
      </div>

      <div className="divide-y divide-slate-100 dark:divide-slate-700">
        {isLoading ? (
          <div className="p-4">
            <Loading />
          </div>
        ) : isError ? (
          <div className="p-4 text-center text-sm text-danger-500">
            Error loading notifications.
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-4 text-center text-sm text-slate-500">
            No notifications yet.
          </div>
        ) : (
          notifications.map((notification, i) => (
            <MenuItem key={i}>
              {({ active }) => (
               
                <Link
                  to={getNotificationLink(notification)}
                  className={`block w-full px-4 py-3 cursor-pointer ${
                    active ? "bg-slate-100 dark:bg-slate-700" : ""
                  } ${
                    notification.is_read === 0
                      ? getNotificationStyles(notification.notification_nature)
                      : "border-l-2 border-transparent"
                  }`}
                >
               
                  <div className="flex ltr:text-left rtl:text-right">
                    <div className="flex-1">
                      <div className="text-slate-800 dark:text-slate-300 text-sm font-medium mb-1">
                        {formatNotificationType(notification.notification_type)}
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-400">
                        {notification.notification_message}
                      </div>
                      <div className="text-slate-400 dark:text-slate-400 text-xs mt-1">
                        {formatDistanceToNow(new Date(notification.created_at), {
                          addSuffix: true,
                        })}
                      </div>
                    </div>
                  </div>
                </Link>
              )}
            </MenuItem>
          ))
        )}
      </div>

      {notifications.length > 0 && (
         <div className="px-4 py-2 text-center border-t border-slate-100 dark:border-slate-600">
          <Link
            to="/notifications" 
            className="text-sm text-slate-800 dark:text-slate-200 font-medium"
          >
            View all notifications
          </Link>
        </div>
      )}
    </Dropdown>
  );
};

export default Notification;
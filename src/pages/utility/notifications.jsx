import React, { useEffect } from "react";
import { Link } from "react-router-dom"; 
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import Cookies from "js-cookie";
import { formatDistanceToNow } from "date-fns";

import Card from "@/components/ui/Card";
import Icon from "@/components/ui/Icon";
import Loading from "@/components/Loading";
import DefaultUserImage from "@/assets/images/users/user-1.jpg";

const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_BASE_URL;
const NOTIFICATIONS_API_URL = `${BACKEND_BASE_URL}/api/my-notifications`;
const MARK_AS_READ_API_URL = `${BACKEND_BASE_URL}/api/update-notification-read-status`;

const fetchNotifications = async () => {
  const token = Cookies.get("token");
  if (!token) throw new Error("Authentication token not found.");
  const response = await axios.get(NOTIFICATIONS_API_URL, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

const markNotificationsAsRead = async () => {
  const token = Cookies.get("token");
  if (!token) throw new Error("Authentication token not found.");
  const response = await axios.post(
    MARK_AS_READ_API_URL,
    {},
    { headers: { Authorization: `Bearer ${token}` } }
  );
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
      return "bg-success-500/10 border-l-4 border-success-500";
    case "warning":
      return "bg-warning-500/10 border-l-4 border-warning-500";
    case "error":
      return "bg-danger-500/10 border-l-4 border-danger-500";
    default:
      return "border-l-4 border-transparent";
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


const NotificationPage = () => {
  const queryClient = useQueryClient();

  const {
    data: notificationData,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["notifications"],
    queryFn: fetchNotifications,
  });

  const { mutate: updateReadStatus } = useMutation({
    mutationFn: markNotificationsAsRead,
    onSuccess: () => {
      console.log("Successfully marked notifications as read.");
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (error) => {
      console.error("Failed to mark notifications as read:", error);
    },
  });

  useEffect(() => {
    if (!notificationData) return;
    
    const hasUnread =
      notificationData?.notifications?.data?.some(
        (item) => item.is_read === 0
      ) || false;

    if (hasUnread) {
      updateReadStatus();
    }
  }, [notificationData, updateReadStatus]);

  const notificationList = notificationData?.notifications?.data || [];

  return (
    <div>
      <Card>
        <div className="flex justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700">
          <h4 className="card-title mb-0">All Notifications</h4>
        </div>
        <div className="p-4 space-y-3">
          {isLoading && (
            <div className="flex justify-center items-center h-48">
              <Loading />
            </div>
          )}
          {isError && (
            <div className="text-center text-red-500 p-4">
              Error loading notifications. Please try again later.
            </div>
          )}
          {!isLoading && !isError && notificationList.length === 0 && (
            <div className="text-center text-slate-500 p-4">
              You have no notifications.
            </div>
          )}
          
          {notificationList.map((item) => (
            <Link
              key={item.id}
              to={getNotificationLink(item)} 
              className={`block w-full px-4 py-3 text-sm rounded-md transition-all duration-150 hover:bg-slate-100 dark:hover:bg-slate-700 ${getNotificationStyles(
                item.notification_nature
              )}`}
            >
              <div className="flex ltr:text-left rtl:text-right">
               
                <div className="flex-1">
                  <div className="text-slate-800 dark:text-slate-300 text-sm font-medium mb-1">
                    {formatNotificationType(item.notification_type)}
                  </div>
                  <div className="text-slate-600 dark:text-slate-400 text-xs leading-4">
                    {item.notification_message}
                  </div>
                  <div className="text-slate-400 dark:text-slate-500 text-xs mt-1">
                    {formatDistanceToNow(new Date(item.created_at), {
                      addSuffix: true,
                    })}
                  </div>
                </div>
              </div>
            </Link>
          ))}

        </div>
      </Card>
    </div>
  );
};

export default NotificationPage;
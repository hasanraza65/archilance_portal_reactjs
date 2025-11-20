import React from "react";
import Dropdown from "@/components/ui/Dropdown";
import Icon from "@/components/ui/Icon";
import { Link } from "react-router-dom";
import { MenuItem } from "@headlessui/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import Cookies from "js-cookie";
import { formatDistanceToNow } from "date-fns";
import Loading from "@/components/Loading";
import DefaultUserImage from "@/assets/images/users/user-1.jpg";

// ====================================================================
// SECTION 1: API AND HELPER FUNCTIONS
// ====================================================================

const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_BASE_URL;
const NOTIFICATIONS_API_URL = `${BACKEND_BASE_URL}/api/my-notifications`;
const MARK_ALL_AS_READ_API_URL = `${BACKEND_BASE_URL}/api/update-notification-read-status`;
const MARK_SINGLE_AS_READ_BASE_URL = `${BACKEND_BASE_URL}/api/notifications`;

// API Function: Backend se notifications fetch karne ke liye
const fetchNotifications = async () => {
  const token = Cookies.get("token");
  if (!token) throw new Error("Authentication token not found.");
  const response = await axios.get(NOTIFICATIONS_API_URL, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
  });
  return response.data;
};

// API Function: Sabhi notifications ko 'read' mark karne ke liye
const markAllNotificationsAsRead = async () => {
  const token = Cookies.get("token");
  if (!token) throw new Error("Authentication token not found.");
  await axios.post(
    MARK_ALL_AS_READ_API_URL,
    {},
    { headers: { Authorization: `Bearer ${token}` } }
  );
};

// API Function: Sirf ek notification ko uski ID se 'read' mark karne ke liye
const markSingleNotificationAsRead = async (notificationId) => {
  const token = Cookies.get("token");
  if (!token) throw new Error("Authentication token not found.");
  await axios.post(
    `${MARK_SINGLE_AS_READ_BASE_URL}/${notificationId}/mark-as-read`,
    {},
    { headers: { Authorization: `Bearer ${token}` } }
  );
};

// Helper Function: Notification type ko format karne ke liye
const formatNotificationType = (type = "") => {
  if (!type) return "Notification";
  return type.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
};

// Helper Function: Notification nature ke hisab se CSS classes dene ke liye
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

// Helper Function: Notification ke liye sahi link generate karne ke liye (WITH PATCH)
const getNotificationLink = (notification) => {
  const { notification_type, project_id, task_id } = notification;
  if (notification_type?.includes("task_")) {
    if (task_id) return `/project/${task_id}`;
    if (project_id) {
      console.warn(
        `[Temporary Patch] Using project_id for a task notification. Fix in backend.`
      );
      return `/project/${project_id}`;
    }
  }
  if (notification_type?.includes("project_")) {
    if (project_id) return `/jobs/${project_id}`;
  }
  return "#";
};

// ====================================================================
// SECTION 2: UI COMPONENTS
// ====================================================================

const NotifyLabel = ({ unreadCount }) => (
  <span className="relative lg:h-[32px] lg:w-[32px] lg:bg-slate-100 text-slate-900 lg:dark:bg-slate-900 dark:text-white cursor-pointer rounded-full text-[20px] flex flex-col items-center justify-center">
    <Icon icon="heroicons-outline:bell" className="animate-tada" />
    {unreadCount > 0 && (
      <span className="absolute lg:right-0 lg:top-0 -top-2 -right-2 h-4 w-4 bg-red-500 text-[8px] font-semibold flex flex-col items-center justify-center rounded-full text-white z-99">
        {unreadCount > 9 ? "9+" : unreadCount}
      </span>
    )}
  </span>
);

const Notification = () => {
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["notifications"],
    queryFn: fetchNotifications,
  });

  const { mutate: markAllAsReadMutation } = useMutation({
    mutationFn: markAllNotificationsAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (error) => console.error("Failed to mark all as read:", error),
  });

  const { mutate: markOneAsReadMutation } = useMutation({
    mutationFn: markSingleNotificationAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (error) =>
      console.error("Failed to mark single notification as read:", error),
  });

  const notifications = data?.notifications?.data || [];
  const unreadCount = data?.total_unread || 0;

  const handleMarkAsReadClick = (e, notificationId) => {
    e.preventDefault();
    e.stopPropagation();
    markOneAsReadMutation(notificationId);
  };

  return (
    <Dropdown
      classMenuItems="md:w-[300px] top-[58px]"
      label={<NotifyLabel unreadCount={unreadCount} />}
    >
      <div className="flex justify-between items-center px-4 py-4 border-b border-slate-100 dark:border-slate-600">
        <h4 className="text-sm font-medium text-slate-800 dark:text-slate-200">
          Notifications
        </h4>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={() => markAllAsReadMutation()}
            className="text-xs font-normal text-slate-500 dark:text-slate-400 cursor-pointer hover:text-slate-800 dark:hover:text-white transition-colors duration-150"
          >
            Mark all as read
          </button>
        )}
      </div>

      <div className="divide-y divide-slate-100 dark:divide-slate-700 max-h-[300px] overflow-y-auto">
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
          notifications.map((notification) => (
            <MenuItem key={notification.id}>
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
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <div className="flex-none ltr:mr-3 rtl:ml-3">
                        <div className="h-8 w-8 bg-white rounded-full">
                          <img
                            src={DefaultUserImage}
                            alt="User"
                            className="h-full w-full object-cover rounded-full"
                          />
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="text-slate-800 dark:text-slate-300 text-sm font-medium mb-1">
                          {formatNotificationType(
                            notification.notification_type
                          )}
                        </div>
                        <div className="text-xs text-slate-600 dark:text-slate-400">
                          {notification.notification_message}
                        </div>
                        <div className="text-slate-400 dark:text-slate-400 text-xs mt-1">
                          {formatDistanceToNow(
                            new Date(notification.created_at),
                            { addSuffix: true }
                          )}
                        </div>
                      </div>
                    </div>
                    {notification.is_read === 0 && (
                      <div className="flex-none ltr:ml-3 rtl:mr-3">
                        <button
                          type="button"
                          onClick={(e) =>
                            handleMarkAsReadClick(e, notification.id)
                          }
                          title="Mark as read"
                          className="w-4 h-4 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-success-500 transition-all duration-150"
                        >
                          <Icon icon="mdi:check" className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </Link>
              )}
            </MenuItem>
          ))
        )}
      </div>

      {notifications.length > 0 && !isError && (
        <MenuItem>
          {({ active }) => (
            <Link
              to="/notifications"
              className={`block w-full text-center px-4 py-2 border-t border-slate-100 dark:border-slate-600 text-sm text-slate-800 dark:text-slate-200 font-medium ${
                active ? "bg-slate-100 dark:bg-slate-700" : ""
              }`}
            >
              View all notifications
            </Link>
          )}
        </MenuItem>
      )}
    </Dropdown>
  );
};

export default Notification;

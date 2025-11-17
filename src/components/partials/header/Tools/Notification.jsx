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

// Default user image for notifications
import DefaultUserImage from "@/assets/images/users/user-1.jpg";

// ====================================================================
// SECTION 1: API FETCHING LOGIC
// ====================================================================

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

// ====================================================================
// SECTION 2: HELPER FUNCTIONS (Formatting ke liye)
// ====================================================================

/**
 * Ye function 'project_status_changed' ko 'Project Status Changed' mein badal dega.
 * @param {string} type - The notification_type from the API.
 * @returns {string} - A nicely formatted title.
 */
const formatNotificationType = (type = "") => {
  if (!type) return "Notification";
  return type
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

/**
 * Ye function notification_nature ke hisab se colors ke liye CSS classes dega.
 * @param {string} nature - The notification_nature ('success', 'warning', etc.).
 * @returns {string} - Tailwind CSS classes.
 */
const getNotificationStyles = (nature) => {
  switch (nature) {
    case "success":
      return "bg-success-500/10 border-l-2 border-success-500"; // Light green background, green left border
    case "warning":
      return "bg-warning-500/10 border-l-2 border-warning-500"; // Light yellow background
    case "error":
      return "bg-danger-500/10 border-l-2 border-danger-500"; // Light red background
    default:
      return "border-l-2 border-transparent"; // No special color
  }
};

// ====================================================================
// SECTION 3: COMPONENTS
// ====================================================================

// Bell icon ka component jo unread count dikhayega
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
    refetchInterval: 60000, // Har 1 minute mein data refresh karega
  });

  const notificationList = data?.notifications?.data || [];
  const totalUnread = data?.total_unread || 0;

  return (
    <Dropdown
      classMenuItems="md:w-[340px] top-[58px]" // Thora sa width barha dia
      label={<NotifyLabel unreadCount={totalUnread} />}
    >
      <div className="flex justify-between px-4 py-4 border-b border-slate-100 dark:border-slate-600">
        <div className="text-sm text-slate-800 dark:text-slate-200 font-medium leading-6">
          Notifications
        </div>
        <div className="text-slate-800 dark:text-slate-200 text-xs md:text-right">
          <Link to="/notifications" className="underline">
            View all
          </Link>
        </div>
      </div>
      <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[400px] overflow-y-auto">
        {isLoading && (
          <div className="flex justify-center items-center py-4">
            <Loading />
          </div>
        )}
        {isError && (
          <div className="px-4 py-4 text-sm text-red-500 text-center">
            Failed to load notifications.
          </div>
        )}
        {!isLoading && !isError && notificationList.length === 0 && (
          <div className="px-4 py-4 text-sm text-slate-500 text-center">
            You have no new notifications.
          </div>
        )}
        {notificationList.map((item) => (
          <MenuItem key={item.id}>
            {({ isActive }) => (
              <div
                className={`${
                  isActive
                    ? "bg-slate-100 dark:bg-slate-700"
                    : "text-slate-600 dark:text-slate-300"
                } block w-full px-4 py-3 text-sm cursor-pointer ${getNotificationStyles(
                  item.notification_nature
                )}`} // Yahan conditional color apply kiya hai
              >
                <div className="flex ltr:text-left rtl:text-right">
                  <div className="flex-none ltr:mr-3 rtl:ml-3">
                    <div className="h-8 w-8 bg-white rounded-full">
                      <img
                        src={DefaultUserImage}
                        alt=""
                        className="block w-full h-full object-cover rounded-full border border-transparent"
                      />
                    </div>
                  </div>
                  <div className="flex-1">
                    {/* TITLE: Yahan humne notification_type ko format karke dikhaya hai */}
                    <div className="text-slate-800 dark:text-slate-300 text-sm font-medium mb-1">
                      {formatNotificationType(item.notification_type)}
                    </div>
                    {/* DESCRIPTION: Yahan notification_message aa gaya */}
                    <div className="text-slate-600 dark:text-slate-400 text-xs leading-4">
                      {item.notification_message}
                    </div>
                    {/* TIME: Yahan created_at ko format karke dikhaya hai */}
                    <div className="text-slate-400 dark:text-slate-500 text-xs mt-1">
                      {formatDistanceToNow(new Date(item.created_at), {
                        addSuffix: true,
                      })}
                    </div>
                  </div>
                  {/* UNREAD DOT: Ye `is_read` ki value pe depend karta hai */}
                  {item.is_read === 0 && (
                    <div className="flex-0">
                      <span className="h-2 w-2 bg-danger-500 rounded-full inline-block"></span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </MenuItem>
        ))}
      </div>
    </Dropdown>
  );
};

export default Notification;
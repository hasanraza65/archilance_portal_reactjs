import React from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import ErrorImage from "@/assets/images/all-img/404-2.svg";

function Error() {
  const user = useSelector((state) => state.auth.user);

  const getHomepageLink = () => {
    if (!user) {
      return "/"; // Logged-out users ke liye login page
    }

    const rolesWithDashboard = ["admin", "customer", "member"];
    if (rolesWithDashboard.includes(user.role)) {
      return "/dashboard";
    }

    // Baaki sabhi logged-in users ke liye (employee, manager, etc.)
    return "/jobs";
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center text-center py-20 dark:bg-slate-900">
      <img src={ErrorImage} alt="Page Not Found" />
      <div className="max-w-[546px] mx-auto w-full mt-12">
        <h4 className="text-slate-900 mb-4">Page not found</h4>
        <div className="dark:text-white text-base font-normal mb-10">
          The page you are looking for might have been removed, had its name
          changed, or is temporarily unavailable.
        </div>
      </div>
      <div className="max-w-[300px] mx-auto w-full">
        <Link
          to={getHomepageLink()}
          className="btn btn-dark dark:bg-slate-800 block text-center"
        >
          Go to homepage
        </Link>
      </div>
    </div>
  );
}

export default Error;
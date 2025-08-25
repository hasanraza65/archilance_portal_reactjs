import React, { useState, useEffect } from "react";
import { useLocation, NavLink } from "react-router-dom";
import Icon from "@/components/ui/Icon";

const Breadcrumbs = () => {
  const location = useLocation();
  const [breadcrumbs, setBreadcrumbs] = useState([]);
  const [isHide, setIsHide] = useState(true);

  useEffect(() => {
    const pathParts = location.pathname.split("/").filter((part) => part);
    if (pathParts.length === 0) {
      setIsHide(true);
      return;
    }

    const newBreadcrumbs = [];
    const baseRoute = pathParts[0];

    // Routes jo "Jobs" section se related hain
    const jobRelatedRoutes = ["jobs", "job", "project", "job-brief"];

    if (jobRelatedRoutes.includes(baseRoute)) {
      setIsHide(false);

      // 1. Parent Page: Jobs
      newBreadcrumbs.push({
        title: "Jobs",
        link: "/jobs",
      });

      const jobIdFromUrl = pathParts[1];
      const jobIdFromState = location.state?.jobId;

      // 2. Intermediate Page: Job Details
      // Yeh logic check karta hai ke kya hum project page par hain aur hamare paas state mein jobId hai
      if (baseRoute === "project" && jobIdFromState) {
        newBreadcrumbs.push({
          title: "Job Details",
          link: `/jobs/${jobIdFromState}`,
        });
      } else if (baseRoute === "job" && jobIdFromUrl) { // Kanban route ke liye
        newBreadcrumbs.push({
            title: "Job Details",
            link: `/jobs/${jobIdFromUrl}`,
          });
      }

      // 3. Current Page Title
      let currentPageTitle = "";
      switch (baseRoute) {
        case "jobs":
          if (pathParts.length > 1) currentPageTitle = "Job Details";
          break;
        case "project":
          currentPageTitle = "Project Details";
          break;
        case "job":
          if (pathParts[2] === "kanban") currentPageTitle = "Kanban Board";
          break;
        case "job-brief":
          currentPageTitle = "Brief Details";
          break;
        default:
          break;
      }
      
      // Current page ko breadcrumb mein add karein agar woh pehle se add na ho
      if (currentPageTitle) {
        newBreadcrumbs.push({
           title: currentPageTitle,
           link: location.pathname,
        });
      }

    } else {
      // Baaki routes ke liye breadcrumbs hide karein
      setIsHide(true);
    }

    setBreadcrumbs(newBreadcrumbs);

  }, [location.pathname, location.state]);

  const lastIndex = breadcrumbs.length - 1;

  return (
    <>
      {!isHide ? (
        <div className="md:mb-6 mb-4 flex space-x-3 rtl:space-x-reverse">
          <ul className="breadcrumbs">
            <li className="text-primary-500">
              <NavLink to="/dashboard" className="text-lg">
                <Icon icon="heroicons-outline:home" />
              </NavLink>
              <span className="breadcrumbs-icon rtl:transform rtl:rotate-180">
                <Icon icon="heroicons:chevron-right" />
              </span>
            </li>

            {breadcrumbs.map((crumb, index) => (
              <li key={index} className={index === lastIndex ? "text-slate-500 dark:text-slate-400" : "text-primary-500"}>
                {index !== lastIndex ? (
                  <NavLink to={crumb.link} className="capitalize">
                    {crumb.title}
                  </NavLink>
                ) : (
                  <span className="capitalize">{crumb.title}</span>
                )}
                {index !== lastIndex && (
                  <span className="breadcrumbs-icon rtl:transform rtl:rotate-180">
                    <Icon icon="heroicons:chevron-right" />
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </>
  );
};

export default Breadcrumbs;
import React, { useState, useEffect } from "react";
import { useLocation, NavLink } from "react-router-dom";
import { menuItems } from "@/constant/data";
import Icon from "@/components/ui/Icon";

const Breadcrumbs = () => {
  const location = useLocation();
  const [isHide, setIsHide] = useState(true);
  const [groupTitle, setGroupTitle] = useState("");
  const [pageTitle, setPageTitle] = useState("");
  const [parentPage, setParentPage] = useState(null);

  useEffect(() => {
    const locationName = location.pathname.replace(/^\//, "");
    const locationParts = locationName.split("/");
    let baseRoute = locationParts[0];

    const parentMap = {
      jobs: "jobs",
      job: "jobs",
      project: "jobs",
      "job-brief": "jobs",
    };

    const parentBaseRoute = parentMap[baseRoute] || baseRoute;

    const mainMenuItem = menuItems.find(
      (item) => item.link === parentBaseRoute
    );

    if (mainMenuItem) {
      setIsHide(mainMenuItem.isHide || false);
      setGroupTitle("");

      if (locationParts.length > 1) {
        setParentPage({
          title: mainMenuItem.title,
          link: `/${mainMenuItem.link}`,
        });

        let dynamicTitle = baseRoute.replace("-", " ") + " Details";
        if (baseRoute === "jobs") {
          dynamicTitle = "Job Details";
        } else if (baseRoute === "project") {
          dynamicTitle = "Project Details";
        } else if (baseRoute === "job") {
          dynamicTitle = "Kanban Board";
        } else if (baseRoute === "job-brief") {
          dynamicTitle = "Brief Details";
        }
        setPageTitle(dynamicTitle);
      } else {
        setParentPage(null);
        setPageTitle(mainMenuItem.title);
      }
    } else {
      setIsHide(true);
    }
  }, [location.pathname]);

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

            {groupTitle && groupTitle.toLowerCase() !== "menu" && (
              <li className="text-primary-500">
                <button type="button" className="capitalize">
                  {groupTitle}
                </button>
                <span className="breadcrumbs-icon rtl:transform rtl:rotate-180">
                  <Icon icon="heroicons:chevron-right" />
                </span>
              </li>
            )}

            {parentPage && (
              <li className="text-primary-500">
                <NavLink to={parentPage.link} className="capitalize">
                  {parentPage.title}
                </NavLink>
                <span className="breadcrumbs-icon rtl:transform rtl:rotate-180">
                  <Icon icon="heroicons:chevron-right" />
                </span>
              </li>
            )}

            <li className="capitalize text-slate-500 dark:text-slate-400">
              {pageTitle.replace("-", " ")}
            </li>
          </ul>
        </div>
      ) : null}
    </>
  );
};

export default Breadcrumbs;

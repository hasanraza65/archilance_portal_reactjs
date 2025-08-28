import React from "react";
import { NavLink } from "react-router-dom";
import Icon from "@/components/ui/Icon";
import { useBreadcrumbs } from "./BreadcrumbsContext";

const Breadcrumbs = () => {
  const { breadcrumbs } = useBreadcrumbs();

  if (!breadcrumbs || breadcrumbs.length === 0) {
    return null;
  }

  const lastIndex = breadcrumbs.length - 1;

  return (
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
          <li
            key={index}
            className={
              index === lastIndex
                ? "text-slate-500 dark:text-slate-400" 
                : "text-primary-500"
            }
          >
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
  );
};

export default Breadcrumbs;
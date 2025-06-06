// File Path: ./src/components/ui/Pagination.js

import React from "react";
import Icon from "@/components/ui/Icon";

/**
 * Yeh function hamesha 3 pages ka "sliding window" banata hai.
 * Example: Agar current page 5 hai to yeh [4, 5, 6] return karega.
 * Agar total pages 1 hai, to yeh [1, 2, 3] return karega.
 */
const generateDisplayPages = (totalPages, currentPage) => {
  if (currentPage === 1) {
    return [1, 2, 3];
  }
  if (currentPage === totalPages && totalPages > 1) {
    if (totalPages < 3) return [1, 2, 3];
    return [totalPages - 2, totalPages - 1, totalPages];
  }
  return [currentPage - 1, currentPage, currentPage + 1];
};


const Pagination = ({
  totalPages,
  currentPage,
  handlePageChange,
  className = "flex justify-center",
}) => {
  const pagesToDisplay = generateDisplayPages(totalPages, currentPage);

  return (
    <div className={className}>
      <ul className="flex items-center space-x-1">
        {/* Previous Button */}
        <li>
          <button
            className="flex items-center justify-center h-8 w-8 rounded-full text-slate-600 dark:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <Icon icon="heroicons-outline:chevron-left" className="h-5 w-5" />
          </button>
        </li>

        {/* Page Numbers (Hamesha 3 dikhenge) */}
        {pagesToDisplay.map((page) => {
          const isActive = page === currentPage;
          const isOutOfRange = page > totalPages;

          // --- CHANGE IS HERE: Class names ko saaf tareeke se likha gaya hai ---
          // Base classes jo har button mein hongi
          const baseClasses = "flex items-center justify-center h-8 w-8 rounded-md text-sm font-medium transition-colors duration-150";

          // Condition ke hisaab se classes
          let specificClasses = "";
          if (isActive) {
            // Agar button active hai (current page hai)
            specificClasses = "bg-slate-900 dark:bg-slate-600 text-white cursor-default";
          } else if (isOutOfRange) {
            // Agar page number total pages se zyada hai
            specificClasses = "text-slate-600 dark:text-slate-300 opacity-40 cursor-not-allowed";
          } else {
            // Normal clickable button
            specificClasses = "text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700";
          }
          // --- END OF CHANGE ---

          return (
            <li key={page}>
              <button
                disabled={isActive || isOutOfRange}
                // Dono class sets ko mila kar yahan istemal karein
                className={`${baseClasses} ${specificClasses}`}
                onClick={() => handlePageChange(page)}
              >
                {page}
              </button>
            </li>
          );
        })}

        {/* Next Button */}
        <li>
          <button
            className="flex items-center justify-center h-8 w-8 rounded-full text-slate-600 dark:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            <Icon icon="heroicons-outline:chevron-right" className="h-5 w-5" />
          </button>
        </li>
      </ul>
    </div>
  );
};

export default Pagination;
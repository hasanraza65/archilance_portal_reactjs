import { useEffect } from "react";

const ResponsiveTableStyles = () => {
    useEffect(() => {
        const styleId = "responsive-project-details-styles";
        if (document.getElementById(styleId)) return;

        const style = document.createElement("style");
        style.id = styleId;
        style.textContent = `
      .responsive-project-table {
        table-layout: fixed;
        width: 100%;
      }
      .responsive-project-table td, .responsive-project-table th {
        word-break: break-word;
      }
      @media (max-width: 767px) {
        .responsive-project-table thead {
          display: none;
        }
        .responsive-project-table tbody tr {
          display: block;
          margin-bottom: 1rem;
          border-radius: 0.75rem;
          border: 1px solid #e2e8f0; /* slate-200 */
          box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.05);
          padding: 0.25rem;
          background-color: #ffffff; /* white */
        }
        .dark .responsive-project-table tbody tr {
          border-color: #334155; /* slate-700 */
          background-color: #1e293b; /* slate-800 */
        }
        .responsive-project-table td {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem 1rem;
          text-align: right;
          border-bottom: 1px solid #f1f5f9; /* slate-100 */
        }
        .dark .responsive-project-table td {
          border-bottom-color: #334155; /* slate-700 */
        }
        .responsive-project-table tr td:last-child {
          border-bottom: none;
        }
        .responsive-project-table td::before {
          content: attr(data-label);
          font-weight: 600;
          text-align: left;
          margin-right: 1rem;
          color: #475569; /* slate-600 */
        }
        .dark .responsive-project-table td::before {
          color: #94a3b8; /* slate-400 */
        }
      }
    `;
        document.head.appendChild(style);
        return () => {
            const styleElement = document.getElementById(styleId);
            if (styleElement) {
                document.head.removeChild(styleElement);
            }
        };
    }, []);

    return null;
};

export default ResponsiveTableStyles;

// src/components/TaskDetails/PartialTask/TaskAttachments.jsx
import React from "react";
const getMimeTypeFromFileExtension = (fileName) => {
  if (typeof fileName !== "string") return null;
  const extension = fileName.split(".").pop()?.toLowerCase();
  if (!extension) return null;

  switch (extension) {
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "gif":
      return "image/gif";
    case "webp":
      return "image/webp";
    case "svg":
      return "image/svg+xml";
    case "pdf":
      return "application/pdf";
    case "doc":
      return "application/msword";
    case "docx":
      return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    case "xls":
      return "application/vnd.ms-excel";
    case "xlsx":
      return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    case "txt":
      return "text/plain";
    case "csv":
      return "text/csv";
    default:
      return "application/octet-stream";
  }
};

const getFileIcon = (fileType) => {
  const iconClasses = "w-10 h-10";

  if (!fileType) {
    return (
      <svg
        className={`${iconClasses} text-slate-400`}
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path
          fillRule="evenodd"
          d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
          clipRule="evenodd"
        />
      </svg>
    );
  }
  if (fileType.startsWith("image/")) {
    return (
      <svg
        className={`${iconClasses} text-green-500`}
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path
          fillRule="evenodd"
          d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
          clipRule="evenodd"
        />
      </svg>
    );
  } else if (fileType === "application/pdf") {
    return (
      <svg
        className={`${iconClasses} text-red-500`}
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path
          fillRule="evenodd"
          d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
          clipRule="evenodd"
        />
      </svg>
    );
  } else {
    return (
      <svg
        className={`${iconClasses} text-blue-500`}
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path
          fillRule="evenodd"
          d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
          clipRule="evenodd"
        />
      </svg>
    );
  }
};

const formatFileSize = (bytes) => {
  if (bytes === 0 || bytes === undefined || bytes === null) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  if (bytes < k) return bytes + " " + sizes[0];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

const TaskAttachments = ({ attachments }) => {
  if (!attachments || attachments.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-4 md:p-6 mt-6">
        <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-3">
          Attachments
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          No attachments for this task.
        </p>
      </div>
    );
  }

  const renderAttachmentCard = (attachment) => {
    if (!attachment || !attachment.id) return null;

    const fileName = attachment.file_name || "Unnamed File";
    const originalMimeType = attachment.mime_type;
    const fileSize = attachment.file_size;

    let effectiveMimeType = originalMimeType;
    if (
      !effectiveMimeType ||
      effectiveMimeType === "application/octet-stream"
    ) {
      const inferredMimeType = getMimeTypeFromFileExtension(fileName);
      if (inferredMimeType) {
        effectiveMimeType = inferredMimeType;
      }
    }
    if (!effectiveMimeType) effectiveMimeType = "application/octet-stream";

    let attachmentPathFromDb = attachment.file_path || "";
    let attachmentUrl = attachmentPathFromDb;

    if (
      !(
        attachmentPathFromDb.startsWith("http://") ||
        attachmentPathFromDb.startsWith("https://")
      )
    ) {
      const backendBaseUrl = (import.meta.env.VITE_BACKEND_BASE_URL || "")
        .toString()
        .trim();

      if (!backendBaseUrl) {
        console.warn(
          `VITE_BACKEND_BASE_URL is not set in your .env file. 
This variable is used for constructing public file URLs.
Relative path for attachment "${fileName}" may be incorrect. 
Current path used: ${attachmentPathFromDb}`
        );
      } else {
        const normalizedBase = backendBaseUrl.endsWith("/")
          ? backendBaseUrl
          : backendBaseUrl + "/";

        const storageSegment = "storage/";

        const normalizedRelativePath =
          attachmentPathFromDb.startsWith("/") &&
          attachmentPathFromDb.length > 0
            ? attachmentPathFromDb.substring(1)
            : attachmentPathFromDb;

        attachmentUrl =
          normalizedBase + storageSegment + normalizedRelativePath;
      }
    }

    const isImage = effectiveMimeType.startsWith("image/");
    const isPdf = effectiveMimeType === "application/pdf";

    const brokenImageSvg = `<svg class="w-16 h-16 text-orange-400 dark:text-orange-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m0-10.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.249-8.25-3.286zm0 13.036h.008v.008H12v-.008z" /></svg>`;

    return (
      <div
        key={attachment.id}
        className="bg-slate-50 dark:bg-slate-800/70 p-3 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow flex flex-col"
      >
        <div className="flex-grow flex items-center justify-center w-full h-40 mb-2 rounded-md overflow-hidden bg-slate-200 dark:bg-slate-700">
          {isImage ? (
            <a
              href={attachmentUrl}
              target="_blank"
              rel="noopener noreferrer"
              title={`View ${fileName}`}
              className="block w-full h-full group"
            >
              <img
                src={attachmentUrl}
                alt={fileName}
                className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
                onError={(e) => {
                  e.target.onerror = null;
                  const parent = e.target.parentElement;
                  if (parent) {
                    parent.innerHTML = `<div class="w-full h-full flex items-center justify-center p-2">${brokenImageSvg}</div>`;
                  }
                }}
              />
            </a>
          ) : (
            <div className="w-full h-full flex items-center justify-center p-2">
              {React.cloneElement(getFileIcon(effectiveMimeType), {
                className: "w-16 h-16",
              })}
            </div>
          )}
        </div>
        <div className="mt-1 text-center">
          <a
            href={attachmentUrl}
            target={isImage || isPdf ? "_blank" : "_self"}
            rel="noopener noreferrer"
            download={!(isImage || isPdf) ? fileName : undefined}
            className="block text-sm font-medium text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 truncate"
            title={fileName}
          >
            {fileName}
          </a>
          {/* <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {formatFileSize(fileSize)}
            <a 
                href={attachmentUrl} 
                download={fileName} 
                className="ml-1 text-blue-500 dark:text-blue-400 hover:underline cursor-pointer"
                onClick={(e) => e.stopPropagation()} 
                aria-label={`Download ${fileName}`}
            >
                (Download)
            </a>
          </p> */}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-4 md:p-6 mt-6">
      <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-4">
        Attachments
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {attachments.map(renderAttachmentCard)}
      </div>
    </div>
  );
};

export default TaskAttachments;

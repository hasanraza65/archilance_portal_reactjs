// Shared helpers for the Contracts module.

/** Escape a plain-text value for safe insertion into contract HTML. */
export const escapeHtml = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

/**
 * Replace every {{ key }} placeholder in an HTML body with its (escaped) value.
 * Mirrors App\Support\ContractVariables::render on the backend — unknown/blank
 * placeholders resolve to an empty string.
 */
export const renderTemplate = (html, values = {}) =>
  String(html ?? "").replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key) =>
    Object.prototype.hasOwnProperty.call(values, key) ? escapeHtml(values[key]) : ""
  );

/** Distinct placeholder keys present in an HTML body. */
export const extractPlaceholders = (html) => {
  const set = new Set();
  const re = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;
  let m;
  while ((m = re.exec(String(html || "")))) set.add(m[1]);
  return [...set];
};

/** Insert a {{key}} token at the editor's cursor (or the end if unfocused). */
export const insertVariableAtCursor = (quillRef, key) => {
  const editor = quillRef?.current?.getEditor?.();
  if (!editor) return;
  const token = `{{${key}}}`;
  const range = editor.getSelection(true);
  const index = range ? range.index : editor.getLength();
  editor.insertText(index, token, "user");
  editor.setSelection(index + token.length, 0);
};

/** MS-Word-like Quill toolbar. */
export const quillModules = {
  toolbar: [
    [{ font: [] }, { size: ["small", false, "large", "huge"] }],
    [{ header: [1, 2, 3, 4, 5, 6, false] }],
    ["bold", "italic", "underline", "strike"],
    [{ color: [] }, { background: [] }],
    [{ script: "sub" }, { script: "super" }],
    [{ list: "ordered" }, { list: "bullet" }],
    [{ indent: "-1" }, { indent: "+1" }],
    [{ align: [] }],
    ["blockquote", "code-block"],
    ["link", "image"],
    ["clean"],
  ],
  clipboard: { matchVisual: false },
};

export const quillFormats = [
  "font", "size", "header",
  "bold", "italic", "underline", "strike",
  "color", "background", "script",
  "list", "bullet", "indent", "align",
  "blockquote", "code-block", "link", "image",
];

export const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
};

export const formatDateTime = (dateStr) => {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleString("en-US", {
    year: "numeric", month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
  });
};

/** Tailwind classes for a status badge. */
export const statusBadgeClass = (status) => {
  switch (String(status || "").toLowerCase()) {
    case "accepted":
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400";
    case "declined":
      return "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400";
    case "sent":
    default:
      return "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400";
  }
};

export const CONTRACT_STATUSES = ["Sent", "Accepted", "Declined"];

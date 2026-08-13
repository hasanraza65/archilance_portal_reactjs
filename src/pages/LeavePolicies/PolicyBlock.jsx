import React from "react";
import Icon from "@/components/ui/Icon";

// Renders one content block from leavePolicyContent.js. Kept local to this
// page (not src/components/ui/) since the block shape is specific to this
// content and only used here.
const PolicyBlock = ({ block }) => {
  switch (block.type) {
    case "p":
      return (
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          {block.text}
        </p>
      );
    case "subheading":
      return (
        <p className="text-sm font-semibold text-slate-900 dark:text-white pt-1">
          {block.text}
        </p>
      );
    case "list":
      return (
        <ul className="space-y-1.5">
          {block.items.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
              <Icon icon="heroicons-outline:check-circle" className="text-primary-500 text-[16px] mt-0.5 flex-none" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      );
    case "callout":
      return (
        <div className="rounded-lg border border-warning-300 bg-warning-50 dark:border-warning-500/30 dark:bg-warning-500/10 px-3 py-2.5">
          <p className="text-xs font-semibold text-warning-800 dark:text-warning-300 leading-relaxed">
            {block.text}
          </p>
        </div>
      );
    case "stat":
      return (
        <p className="text-sm font-bold text-slate-900 dark:text-white">
          {block.text}
        </p>
      );
    case "example":
      return (
        <div className="rounded-lg bg-slate-100 dark:bg-slate-700 px-3 py-2.5 font-mono text-xs text-slate-600 dark:text-slate-300 space-y-0.5">
          {block.lines.map((line, i) => (
            <div key={i}>{line}</div>
          ))}
        </div>
      );
    default:
      return null;
  }
};

export default PolicyBlock;

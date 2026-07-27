import React, { useMemo, useState } from "react";
import Icon from "@/components/ui/Icon";

/**
 * Interactive variable palette. Click a variable to drop {{key}} into the editor.
 *
 * props:
 *   catalog  : [{ group, items: [{ key, label, auto }] }]
 *   onInsert : (key) => void
 */
const VariableSidebar = ({ catalog = [], onInsert }) => {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return catalog;
    return catalog
      .map((g) => ({
        ...g,
        items: g.items.filter(
          (it) =>
            it.label.toLowerCase().includes(q) || it.key.toLowerCase().includes(q)
        ),
      }))
      .filter((g) => g.items.length > 0);
  }, [catalog, query]);

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-4 pb-3 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2 mb-1">
          <Icon icon="heroicons-outline:variable" className="text-lg text-indigo-500" />
          <h3 className="text-sm font-semibold text-slate-800 dark:text-white">
            Variables
          </h3>
        </div>
        <p className="text-[11px] text-slate-400 leading-tight">
          Click to insert into the document. Values are filled when you send.
        </p>
        <div className="relative mt-3">
          <Icon
            icon="heroicons-outline:search"
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search variables"
            className="w-full pl-8 pr-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        {filtered.length === 0 && (
          <p className="text-xs text-slate-400 text-center py-6">No variables found.</p>
        )}
        {filtered.map((group) => (
          <div key={group.group}>
            <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-2">
              {group.group}
            </div>
            <div className="flex flex-wrap gap-2">
              {group.items.map((it) => (
                <button
                  key={it.key}
                  type="button"
                  onClick={() => onInsert?.(it.key)}
                  title={`Insert {{${it.key}}}`}
                  className="group inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  {it.auto && (
                    <span
                      className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-none"
                      title="Auto-filled from the employee / company"
                    />
                  )}
                  {it.label}
                  <Icon
                    icon="heroicons-outline:plus"
                    className="text-[11px] opacity-0 group-hover:opacity-100 transition-opacity"
                  />
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-700 flex items-center gap-2 text-[11px] text-slate-400">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-none" />
        Auto-filled from the employee &amp; company
      </div>
    </div>
  );
};

export default VariableSidebar;

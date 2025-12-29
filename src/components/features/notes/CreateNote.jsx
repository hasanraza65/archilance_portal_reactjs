import React, { useState } from "react";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";

const CreateNote = ({ projectId, type, onNoteCreated, isLoading }) => {
  const [noteText, setNoteText] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!noteText.trim()) return;
    onNoteCreated(projectId, noteText, type);
    setNoteText("");
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4">
      <div
        className={`
          flex items-center gap-2 p-2 rounded-lg border transition-all duration-200 bg-white dark:bg-slate-800
          ${
            isFocused
              ? "border-blue-500 ring-1 ring-blue-500 shadow-sm"
              : "border-slate-200 dark:border-slate-700"
          }
        `}
      >
        <div className="pl-2 text-slate-400">
          <Icon icon="heroicons:plus-circle" className="w-5 h-5" />
        </div>
        <input
          type="text"
          placeholder="Add a new item..."
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          disabled={isLoading}
          className="flex-1 bg-transparent !border-0 !ring-0 !outline-none shadow-none text-sm py-1.5 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:ring-0 focus:border-0 focus:outline-none"
        />
        <Button
          type="submit"
          disabled={!noteText.trim() || isLoading}
          className={`
            btn-sm transition-all duration-200
            ${
              noteText.trim()
                ? "bg-blue-600 hover:bg-blue-700 text-white shadow-md"
                : "bg-slate-100 text-slate-400 cursor-not-allowed dark:bg-slate-700"
            }
          `}
        >
          {isLoading ? (
             <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          ) : (
            <span className="text-xs font-semibold px-1">Add</span>
          )}
        </Button>
      </div>
    </form>
  );
};

export default CreateNote;

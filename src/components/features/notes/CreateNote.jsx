import React, { useState } from "react";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";

const CreateNote = ({ projectId, type, onNoteCreated, isLoading }) => {
  const [noteText, setNoteText] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  const [isExpanded, setIsExpanded] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!noteText.trim()) return;
    onNoteCreated(projectId, noteText, type);
    setNoteText("");
    // Keep expanded for adding multiple items quickly, or close? User usually likes quick add. Keep open.
    // If we want to close, uncomment: setIsExpanded(false); 
  };

  if (!isExpanded) {
    return (
        <button 
            type="button"
            onClick={() => {
                setIsExpanded(true);
                // setTimeout(() => document.getElementById('new-note-input')?.focus(), 0);
            }}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 text-sm py-2 px-1 transition-colors mt-2"
        >
            <Icon icon="heroicons:plus" className="w-4 h-4" />
            <span>Add item</span>
        </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-2">
      <div
        className={`
          flex items-center gap-2 p-2 rounded-lg border transition-all duration-200 bg-white dark:bg-slate-800
          border-blue-500 ring-1 ring-blue-500 shadow-sm
        `}
      >
        <div className="pl-1 text-slate-400">
           {isLoading ? (
             <div className="w-4 h-4 border-2 border-slate-300 border-t-blue-500 rounded-full animate-spin"></div>
           ): (
             <div className="w-4 h-4 rounded-full border border-slate-300 dark:border-slate-500"></div>
           )}
        </div>
        <input
          id="new-note-input"
          type="text"
          placeholder="What needs to be done?"
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          autoFocus
          className="flex-1 bg-transparent !border-0 !ring-0 !outline-none shadow-none text-sm py-0.5 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:ring-0 focus:border-0 focus:outline-none"
        />
        <div className="flex items-center gap-1">
            <Button
            type="submit"
            disabled={!noteText.trim() || isLoading}
            className="btn-xs bg-blue-600 hover:bg-blue-700 text-white rounded px-2 py-1"
            >
            Save
            </Button>
            <button
                type="button"
                onClick={() => setIsExpanded(false)}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-500"
            >
                <Icon icon="heroicons:x-mark" className="w-4 h-4" />
            </button>
        </div>
      </div>
    </form>
  );
};

export default CreateNote;

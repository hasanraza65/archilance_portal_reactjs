import React, { useState } from "react";
import Checkbox from "@/components/ui/Checkbox";
import Icon from "@/components/ui/Icon";
import Tooltip from "@/components/ui/Tooltip";

const NoteItem = ({ note, onToggleStatus, onDelete, onEdit }) => {
  const isChecked = note.status === 1 || note.status === true || note.status === "1";
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(note.note_text);

  const handleCheckboxChange = () => {
    onToggleStatus(note);
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (editedText.trim() && editedText !== note.note_text) {
        onEdit(note, editedText);
    }
    setIsEditing(false);
  };

  const startEdit = () => {
      setEditedText(note.note_text);
      setIsEditing(true);
  };

  return (
    <div
      className={`group flex items-start gap-3 py-2 px-2 rounded-md transition-colors duration-200 cursor-pointer
        ${
          isEditing
            ? "bg-white shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700" 
            : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
        }
      `}
      onClick={(e) => {
        // Prevent edit mode when clicking checkbox or delete
        if(e.target.closest('button') || e.target.closest('input')) return;
        startEdit();
      }}
    >
      <div className="relative flex items-center justify-center shrink-0 mt-0.5">
        <input
          type="checkbox"
          checked={isChecked}
          onChange={handleCheckboxChange}
          className={`
            appearance-none w-5 h-5 rounded-full border cursor-pointer transition-all duration-200 ease-out
            focus:ring-2 focus:ring-offset-1 focus:ring-blue-400 focus:outline-none z-10
            ${
              isChecked
                ? "bg-green-500 border-green-500 hover:bg-green-600 hover:border-green-600"
                : "bg-white border-slate-300 hover:border-green-500 dark:bg-slate-700 dark:border-slate-500"
            }
          `}
        />
        <Icon
          icon="heroicons:check"
          className={`
            absolute pointer-events-none w-3.5 h-3.5 text-white transition-transform duration-200 z-20 
            ${isChecked ? "scale-100" : "scale-0"}
          `}
        />
      </div>

      <div className="flex-1 min-w-0">
        {isEditing ? (
            <form onSubmit={handleEditSubmit} className="flex-1">
                <textarea 
                    value={editedText}
                    onChange={(e) => setEditedText(e.target.value)}
                    autoFocus
                    onBlur={() => {
                         if (editedText.trim() && editedText !== note.note_text) {
                            onEdit(note, editedText);
                        }
                        setIsEditing(false);
                    }}
                    onKeyDown={(e) => {
                        if(e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleEditSubmit(e);
                        }
                    }}
                    className="w-full text-sm bg-white dark:bg-slate-900 border border-slate-300 rounded px-2 py-1.5 focus:ring-2 focus:ring-blue-500 outline-none resize-none overflow-hidden"
                    rows={1}
                    style={{ minHeight: '32px' }}
                />
            </form>
        ) : (
            <p
            className={`text-sm break-words leading-relaxed transition-all duration-200 ${
                isChecked
                ? "text-slate-400 dark:text-slate-500"
                : "text-slate-700 dark:text-slate-200"
            }`}
            title={note.note_text}
            >
            {note.note_text}
            </p>
        )}
      </div>

      <div className="flex-shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 self-start">
        <Tooltip content="Delete" placement="top">
          <button
            onClick={(e) => {
                e.stopPropagation();
                onDelete(note);
            }}
            className="text-slate-400 hover:text-red-500 transition-colors p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700"
            type="button"
          >
            <Icon icon="heroicons:trash" className="w-4 h-4" />
          </button>
        </Tooltip>
      </div>
    </div>
  );
};

export default NoteItem;

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
      className={`group flex items-center justify-between p-3 mb-2 rounded-lg border transition-all duration-200 ease-in-out
        ${
          isChecked
            ? "bg-slate-50 border-slate-100 dark:bg-slate-800/50 dark:border-slate-700/50"
            : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm dark:bg-slate-800 dark:border-slate-700 dark:hover:border-slate-600"
        }
      `}
    >
      <div className="flex items-center gap-3 flex-1 overflow-hidden">
        <div className="relative flex items-center justify-center shrink-0">
          <input
            type="checkbox"
            checked={isChecked}
            onChange={handleCheckboxChange}
            className={`
              appearance-none w-5 h-5 rounded border cursor-pointer transition-all duration-200 ease-out
              focus:ring-2 focus:ring-offset-2 focus:ring-slate-400 focus:outline-none
              ${
                isChecked
                  ? "bg-green-500 border-green-500 hover:bg-green-600 hover:border-green-600"
                  : "bg-white border-slate-300 hover:border-slate-400 dark:bg-slate-700 dark:border-slate-600"
              }
            `}
          />
          <Icon
            icon="heroicons:check"
            className={`
              absolute pointer-events-none w-3.5 h-3.5 text-white transition-transform duration-200 
              ${isChecked ? "scale-100" : "scale-0"}
            `}
          />
        </div>
        
        {isEditing ? (
            <form onSubmit={handleEditSubmit} className="flex-1 mr-2">
                <input 
                    type="text" 
                    value={editedText}
                    onChange={(e) => setEditedText(e.target.value)}
                    autoFocus
                    onBlur={() => {
                        // Optional: save on blur or just cancel. Let's submit.
                         if (editedText.trim() && editedText !== note.note_text) {
                            onEdit(note, editedText);
                        }
                        setIsEditing(false);
                    }}
                    className="w-full text-sm bg-slate-50 border border-slate-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 outline-none dark:bg-slate-900 dark:border-slate-600"
                />
            </form>
        ) : (
            <span
            className={`text-sm truncate transition-all duration-200 select-text cursor-pointer ${
                isChecked
                ? "line-through text-slate-400 dark:text-slate-500 decoration-slate-400"
                : "text-slate-700 dark:text-slate-200 font-medium"
            }`}
            title={note.note_text}
            onClick={startEdit}
            >
            {note.note_text}
            </span>
        )}
      </div>
      <div className="flex-shrink-0 ml-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        {!isEditing && (
            <Tooltip content="Edit Note" placement="top">
            <button
                onClick={startEdit}
                className="text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all p-1.5 rounded-md"
                type="button"
            >
                <Icon icon="heroicons:pencil-square" className="w-4 h-4" />
            </button>
            </Tooltip>
        )}
        <Tooltip content="Delete Note" placement="top">
          <button
            onClick={() => onDelete(note)}
            className="text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all p-1.5 rounded-md"
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

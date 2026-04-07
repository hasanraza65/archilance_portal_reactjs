import React, { useState, useEffect, useMemo } from "react";
import NoteItem from "./NoteItem";
import CreateNote from "./CreateNote";
import { notesApi } from "./notesApi";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import Icon from "@/components/ui/Icon";

const NotesContainer = ({ initialNotes = [], parentId, type }) => {
  const [notes, setNotes] = useState(initialNotes);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setNotes(initialNotes);
  }, [initialNotes]);

  // Calculate statistics
  const stats = useMemo(() => {
    const total = notes.length;
    const completed = notes.filter(
      (n) => n.status === 1 || n.status === true || n.status === "1"
    ).length;
    const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);
    return { total, completed, percentage };
  }, [notes]);

  const handleCreateNote = async (pId, text, nType) => {
    setLoading(true);
    try {
      const response = await notesApi.createNote(pId, text, nType);
      const newNote = response.data || response.note || response;
      setNotes((prev) => [newNote, ...prev]);
      toast.success("Item added");
    } catch (error) {
      console.error("Failed to create note:", error);
      toast.error("Failed to add item");
    } finally {
      setLoading(false);
    }
  };

  const [isExpanded, setIsExpanded] = useState(false); // Default collapsed as per "expand and collapse version" request, asking to make it expandable. Or maybe default expanded? Let's default false to keep it clean, or true if items exist. Let's try default false to keep header clean.
  // Actually, user said "make more professional and eexpand and collapse version". usually means toggleable. 
  
  // Update: Let's default to TRUE if there are notes, FALSE if empty? Or just TRUE. 
  // Let's stick to true for visibility, but allow collapse.
  // User might want it collapsed by default to save space in header? 
  // Let's default true for now so they see it.
  
  const handleEditNote = async (note, newText) => {
    // Optimistic update
    const oldText = note.note_text;
    setNotes((prev) =>
        prev.map((n) => (n.id === note.id ? { ...n, note_text: newText } : n))
    );

    try {
        await notesApi.updateNote(note.id, { note_text: newText });
        toast.success("Note updated");
    } catch (error) {
        setNotes((prev) =>
        prev.map((n) => (n.id === note.id ? { ...n, note_text: oldText } : n))
        );
        console.error("Failed to update note:", error);
        toast.error("Failed to update note");
    }
  };

  const handleToggleStatus = async (note) => {
    const oldStatus = note.status;
    const newStatus = oldStatus == 1 ? 0 : 1;

    setNotes((prev) =>
      prev.map((n) => (n.id === note.id ? { ...n, status: newStatus } : n))
    );

    try {
      await notesApi.updateNoteStatus(note.id, newStatus);
    } catch (error) {
      setNotes((prev) =>
        prev.map((n) => (n.id === note.id ? { ...n, status: oldStatus } : n))
      );
      toast.error("Failed to update status");
    }
  };

  const handleDeleteNote = async (note) => {
    try {
      const result = await Swal.fire({
        title: "Delete this item?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#ef4444",
        cancelButtonColor: "#64748b",
        confirmButtonText: "Yes, delete",
        customClass: {
          popup: "rounded-xl",
          confirmButton: "rounded-lg",
          cancelButton: "rounded-lg"
        }
      });

      if (result.isConfirmed) {
        await notesApi.deleteNote(note.id);
        setNotes((prev) => prev.filter((n) => n.id !== note.id));
        toast.success("Item deleted");
      }
    } catch (error) {
      console.error("Failed to delete note:", error);
      toast.error("Failed to delete item");
    }
  };

  return (
    <div className="mt-2 transition-all duration-300">
      {/* Header Section */}
      <div 
        className="flex items-center justify-between py-2 cursor-pointer group mb-2"
        onClick={() => setIsExpanded(!isExpanded)}
      >
         <h3 className="font-medium text-slate-800 dark:text-slate-200 text-sm">
            Notes & Checklist
        </h3>
        
        <Icon 
            icon="heroicons:chevron-down" 
            className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`} 
        />
      </div>

      {/* Progress Bar - Removed as per reference design which is cleaner */}

      {/* Content Section */}
      <div className={`transition-all duration-300 ease-in-out ${isExpanded ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"}`}>
        <div className="">
            <div className="space-y-1 max-h-[200px] overflow-y-auto px-1 custom-scrollbar">
            {notes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 text-center border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg">
                <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-full mb-2">
                    <Icon icon="heroicons:sparkles" className="w-5 h-5 text-slate-300" />
                </div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                    No items yet
                </p>
                </div>
            ) : (
                notes.map((note) => (
                <NoteItem
                    key={note.id}
                    note={note}
                    onToggleStatus={handleToggleStatus}
                    onDelete={handleDeleteNote}
                    onEdit={handleEditNote}
                />
                ))
            )}
            </div>

            <CreateNote
            projectId={parentId}
            type={type}
            onNoteCreated={handleCreateNote}
            isLoading={loading}
            />
        </div>
      </div>
    </div>
  );
};

export default NotesContainer;

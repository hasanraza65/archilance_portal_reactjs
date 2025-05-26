// src/components/TaskDetails/AddSubTaskModal.jsx
import React, { useState } from 'react';
import Cookies from 'js-cookie';
import { toast } from 'react-toastify';

// This is a simplified version of what AddSubTaskModal might look like.
// You should adapt this from your existing SubTaskDetail.jsx
const AddSubTaskModals = ({ isOpen, onClose, parentTaskId, onSubTaskAdded }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Title is required.");
      return;
    }
    setIsSubmitting(true);
    const token = Cookies.get("token");
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_BASE_URL}/api/admin/project-task`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          task_title: title,
          task_description: description,
          parent_task_id: parentTaskId,
          // Add other relevant fields like project_id if needed, or fetch from parent task
        }),
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || "Failed to create sub-task.");
      }
      toast.success("Sub-task added successfully!");
      onSubTaskAdded(); // Callback to refresh the list
      onClose(); // Close modal
      setTitle('');
      setDescription('');
    } catch (error) {
      toast.error(error.message);
      console.error("Error adding sub-task:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Add New Task</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="subtask-title" className="block text-sm font-medium text-slate-700 mb-1">Title</label>
            <input
              type="text"
              id="subtask-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-md"
              required
            />
          </div>
          <div className="mb-4">
            <label htmlFor="subtask-description" className="block text-sm font-medium text-slate-700 mb-1">Description (Optional)</label>
            <textarea
              id="subtask-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows="3"
              className="w-full p-2 border border-slate-300 rounded-md"
            ></textarea>
          </div>
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:bg-blue-300"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Adding...' : 'Add Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddSubTaskModals;
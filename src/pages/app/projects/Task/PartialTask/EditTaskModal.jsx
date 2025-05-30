// src/projects/Task/PartialTask/EditTaskModal.jsx (or similar path)
import React, { useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import Swal from 'sweetalert2';

const EditTaskModal = ({ isOpen, onClose, onTaskUpdated, taskData, projectId }) => {
  const [formData, setFormData] = useState({
    task_title: '',
    task_description: '',
    due_date: '',
    priority: 'Normal',
    // Add other fields like assignees if you manage them here
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (taskData) {
      setFormData({
        task_title: taskData.task_title || '',
        task_description: taskData.task_description || '',
        due_date: taskData.due_date ? new Date(taskData.due_date).toISOString().split('T')[0] : '', // Format for input type="date"
        priority: taskData.priority || 'Normal',
        // ... populate other fields
      });
    }
  }, [taskData]);

  if (!isOpen || !taskData) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const token = Cookies.get('token');

    if (!token) {
      Swal.fire("Authentication Error", "Please log in.", "error");
      setLoading(false);
      return;
    }

    // Ensure formData includes what the API expects
    const payload = {
        ...formData,
        // If your API expects due_date in a specific format or nullable:
        due_date: formData.due_date || null,
    };


    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_BASE_URL}/api/admin/project-task/${taskData.id}`, // Assuming taskData has the task ID
        {
          method: 'PUT', // Or PATCH
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to update task.' }));
        throw new Error(errorData.message || `Error ${response.status}`);
      }

      await response.json(); // Or handle response data
      onTaskUpdated(); // Callback to parent to refetch and close
      onClose();

    } catch (err) {
      setError(err.message);
      Swal.fire('Update Failed', err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-transparent bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md dark:bg-gray-800">
        <h2 className="text-xl font-semibold mb-6 text-gray-800 dark:text-white">Edit Task</h2>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="task_title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Task Title</label>
            <input
              type="text"
              name="task_title"
              id="task_title"
              value={formData.task_title}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              required
            />
          </div>
          <div className="mb-4">
            <label htmlFor="task_description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
            <textarea
              name="task_description"
              id="task_description"
              value={formData.task_description}
              onChange={handleChange}
              rows="3"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            ></textarea>
          </div>
          <div className="mb-4">
            <label htmlFor="due_date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Due Date</label>
            <input
              type="date"
              name="due_date"
              id="due_date"
              value={formData.due_date}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
          <div className="mb-6">
            <label htmlFor="priority" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Priority</label>
            <select
              name="priority"
              id="priority"
              value={formData.priority}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option>Low</option>
              <option>Normal</option>
              <option>High</option>
              <option>Urgent</option>
            </select>
          </div>
          {/* Add Assignees selection here if needed */}
          <div className="flex items-center justify-end gap-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditTaskModal;
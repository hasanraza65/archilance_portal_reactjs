// src/projects/Task/PartialTask/EditTaskModal.jsx (or similar path)
import React, { useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import Swal from 'sweetalert2';
import { toast } from 'react-toastify';

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
  const [attachments, setAttachments] = useState([]);
  const [attachmentsToRemove, setAttachmentsToRemove] = useState([]);
  const [newAttachments, setNewAttachments] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (taskData) {
      setFormData({
        task_title: taskData.task_title || '',
        task_description: taskData.task_description || '',
        due_date: taskData.due_date ? new Date(taskData.due_date).toISOString().split('T')[0] : '', // Format for input type="date"
        priority: taskData.priority || 'Normal',
        attachments: taskData.attachments || [], // Assuming taskData has attachments
        // ... populate other fields
      });
      setAttachments(taskData.attachments || []); // Initialize attachments from taskData
    }
  }, [taskData]);

  if (!isOpen || !taskData) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    const maxSize = 10 * 1024 * 1024; // 10MB limit
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain', 'text/csv'
    ];

    const validFiles = files.filter(file => {
      if (file.size > maxSize) {
        toast.error(`File ${file.name} is too large. Maximum size is 10MB.`);
        return false;
      }
      if (!allowedTypes.includes(file.type)) {
        toast.error(`File type ${file.type} is not allowed for ${file.name}.`);
        return false;
      }
      setNewAttachments(prev => [...prev, file]);
      return true;
    });

    setAttachments(prev => [...prev, ...validFiles]);
    e.target.value = '';
  };

  const removeAttachment = (attachment) => {
    if(attachment.name) {
      setNewAttachments(prev => prev.filter(file => file.name !== attachment.name));
      setAttachments(prev => prev.filter(file => file.name !== attachment.name));
    } else {
      let index = attachments.findIndex(a => a.id === attachment.id);
      setAttachments(prev => prev.filter((_, i) => i !== index));
      setAttachmentsToRemove(prev => [...prev, attachments[index]?.id]);
    }
  };

  const getFileIcon = (fileType) => {
    let tempFileType = fileType.type || fileType.file_type || '';
    if (tempFileType.startsWith('image/')) {
      return (
        <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
        </svg>
      );
    } else if (tempFileType === 'application/pdf') {
      return (
        <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
        </svg>
      );
    } else {
      return (
        <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
        </svg>
      );
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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

    let formData2 = new FormData();
    formData2.append('project_id', projectId);
    formData2.append('task_title', payload.task_title);
    formData2.append('task_description', payload.task_description);
    formData2.append('task_status', taskData.task_status || 'Pending');
    formData2.append('priority', payload.priority);
    formData2.append('due_date', payload.due_date || null);
    formData2.append('_method', 'PUT');

    if(newAttachments.length > 0) {
      newAttachments.forEach(file => {
        formData2.append('attachments[]', file);
      });
    }
    if (attachmentsToRemove.length > 0) {
      attachmentsToRemove.forEach(id => {
        formData2.append('delete_attachments[]', id);
      });
    }
    
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_BASE_URL}/api/admin/project-task/${taskData.id}`, // Assuming taskData has the task ID
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData2,
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to update task.' }));
        throw new Error(errorData.message || `Error ${response.status}`);
      }

      await response.json(); // Or handle response data
      onTaskUpdated(); // Callback to parent to refetch and close
      setAttachmentsToRemove([]);
      setNewAttachments([]);
      setFormData({
        task_title: '',
        task_description: '',
        due_date: '',
        priority: 'Normal',
      });
      
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
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-2xl dark:bg-gray-800">
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
            <label htmlFor="task_description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description (Optional)</label>
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
            <label htmlFor="due_date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Due Date (Optional)</label>
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

          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Attachments (Optional)
            </label>
            <div className="mb-4">
              <label className="flex items-center justify-center w-full px-4 py-6 border-2 border-slate-300 border-dashed rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors">
                <div className="flex flex-col items-center">
                  <svg className="w-8 h-8 text-slate-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <span className="text-sm text-slate-600">Click to upload files</span>
                  <span className="text-xs text-slate-400 mt-1">Max 10MB per file</span>
                </div>
                <input
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                  disabled={isSubmitting}
                  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
                />
              </label>
            </div>

            {attachments.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-700">Selected Files:</p>
                {attachments.map((file, index) => {
                  return (
                    <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <div className="flex items-center space-x-3">
                        {getFileIcon(file)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate">
                            {file.name || file.file_name}
                          </p>
                          <p className="text-xs text-slate-500">
                            {formatFileSize(file.size || file.file_size)}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeAttachment(file)}
                        className="text-red-500 hover:text-red-700 p-1"
                        disabled={isSubmitting}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
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
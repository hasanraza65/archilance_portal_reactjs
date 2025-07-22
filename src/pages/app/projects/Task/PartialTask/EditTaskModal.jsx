// src/projects/Task/PartialTask/EditTaskModal.jsx
import React, { useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import Swal from 'sweetalert2';
import { toast } from 'react-toastify';
import Modal from "@/components/ui/Modal"; // Assuming this is your standard modal component
import Textinput from "@/components/ui/Textinput";
import Flatpickr from "react-flatpickr";
import FormGroup from "@/components/ui/FormGroup";
import Button from "@/components/ui/Button"; // Assuming a Button component
import { getApiPrefix } from "@/pages/utility/apiHelper";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css'; // Snow theme

// Helper functions (getFileIcon, formatFileSize) - keep them as they are
const getFileIcon = (fileType) => { /* ... your existing function ... */
    let tempFileType = fileType.type || fileType.file_type || '';
    if (tempFileType.startsWith('image/')) {
      return ( /* ... image svg ... */ <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" /></svg>);
    } else if (tempFileType === 'application/pdf') {
      return ( /* ... pdf svg ... */ <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" /></svg>);
    } else {
      return ( /* ... default file svg ... */ <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" /></svg>);
    }
};
const formatFileSize = (bytes) => { /* ... your existing function ... */
    if (bytes === 0) return '0 Bytes'; const k = 1024; const sizes = ['Bytes', 'KB', 'MB', 'GB']; const i = Math.floor(Math.log(bytes) / Math.log(k)); return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};
const getApiBasePathForRole = (basePath) => {
  const role = getApiPrefix();
  const cleanBasePath = basePath.startsWith('/') ? basePath : `/${basePath}`;
  console.log(role);
  if (role) {
    return `/api/${role}${cleanBasePath}`;
  }
  return `/api/admin${cleanBasePath}`;
};
const EditTaskModal = ({ isOpen, onClose, onTaskUpdated, taskData, projectId }) => {
  const [currentAttachments, setCurrentAttachments] = useState([]); // For existing attachments
  const [newAttachments, setNewAttachments] = useState([]);       // For newly added files
  const [attachmentsToRemove, setAttachmentsToRemove] = useState([]); // IDs of attachments to delete
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quillDescription, setQuillDescription] = useState('');

  // --- React Hook Form Setup ---
  const FormValidationSchema = yup.object({
    task_title: yup.string().required("Task title is required"),
    task_description: yup.string().nullable(), // Quill content, can be empty
        // .test( // Optional: Add custom validation for Quill content if needed
        //   'has-content',
        //   'Description cannot be just empty tags.',
        //   (value) => !value || value.replace(/<[^>]*>/g, '').trim().length > 0
        // ),
    due_date: yup.date().nullable().typeError("Invalid date format"),
    priority: yup.string().required("Priority is required"),
  }).required();

  const {
    register,
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(FormValidationSchema),
    mode: "onChange", // Or "all"
    defaultValues: {
      task_title: '',
      task_description: '', // Will be set via Quill
      due_date: null,
      priority: 'Normal',
    }
  });

  // Sync Quill with React Hook Form
  useEffect(() => {
    setValue("task_description", quillDescription, { shouldValidate: true, shouldDirty: true });
  }, [quillDescription, setValue]);

  // Populate form when taskData or isOpen changes
  useEffect(() => {
    if (isOpen && taskData) {
      reset({ // Reset RHF with taskData
        task_title: taskData.task_title || '',
        due_date: taskData.due_date ? new Date(taskData.due_date) : null,
        priority: taskData.priority || 'Normal',
      });
      setQuillDescription(taskData.task_description || ''); // Set Quill content
      setCurrentAttachments(taskData.attachments || []);
      setNewAttachments([]);
      setAttachmentsToRemove([]);
    } else if (!isOpen) {
      reset(); // Reset RHF to defaults
      setQuillDescription(''); // Clear Quill
      setCurrentAttachments([]);
      setNewAttachments([]);
      setAttachmentsToRemove([]);
    }
  }, [isOpen, taskData, reset, setValue]);


  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    // ... (keep your existing file validation logic for size and type) ...
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = [ /* ... your allowed types ... */
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain', 'text/csv'
    ];

    const validNewFiles = files.filter(file => {
      if (file.size > maxSize) {
        toast.error(`File ${file.name} is too large (max 10MB).`); return false;
      }
      if (!allowedTypes.includes(file.type)) {
        toast.error(`File type for ${file.name} is not allowed.`); return false;
      }
      return true;
    });
    setNewAttachments(prev => [...prev, ...validNewFiles]);
    e.target.value = ''; // Clear file input
  };

  const removeNewAttachment = (fileToRemove) => {
    setNewAttachments(prev => prev.filter(file => file !== fileToRemove));
  };

  const removeExistingAttachment = (attachmentId) => {
    setCurrentAttachments(prev => prev.filter(att => att.id !== attachmentId));
    setAttachmentsToRemove(prev => [...prev, attachmentId]); // Add ID to removal list
  };


  const onSubmit = async (data) => {
    setIsSubmitting(true);
    const token = Cookies.get('token');
    if (!token) {
      Swal.fire("Authentication Error", "Please log in.", "error");
      setIsSubmitting(false);
      return;
    }

    const formDataPayload = new FormData();
    formDataPayload.append('project_id', projectId);
    formDataPayload.append('task_title', data.task_title);
    formDataPayload.append('task_description', data.task_description); // From RHF, synced with Quill
    formDataPayload.append('task_status', taskData.task_status || 'Pending'); // Keep existing status or default
    formDataPayload.append('priority', data.priority);
    if (data.due_date) {
      formDataPayload.append('due_date', new Date(data.due_date).toISOString().split('T')[0]);
    }
    formDataPayload.append('_method', 'PUT');

    newAttachments.forEach(file => {
      formDataPayload.append('attachments[]', file);
    });
    if (attachmentsToRemove.length > 0) {
      attachmentsToRemove.forEach(id => {
        formDataPayload.append('delete_attachments[]', id);
      });
    }

    try {
        const apiPath = getApiBasePathForRole("/project-brief");
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_BASE_URL}${apiPath}/${taskData.id}`,
        {
          method: 'POST', // Using POST with _method: 'PUT'
          headers: { 'Authorization': `Bearer ${token}` },
          body: formDataPayload,
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to update task. Server error.' }));
        throw new Error(errorData.message || `Error ${response.status}`);
      }

      await response.json();
      toast.success("Task updated successfully!");
      onTaskUpdated(); // Callback to parent
      onClose(); // Close the modal

    } catch (err) {
      console.error("Error updating task:", err);
      Swal.fire('Update Failed', err.message || "An unexpected error occurred.", 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ReactQuill modules and formats
  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, false] }],
      ['bold', 'italic', 'underline'],
      [{'list': 'ordered'}, {'list': 'bullet'}],
      ['link', 'clean']
    ],
  };
  const quillFormats = ['header', 'bold', 'italic', 'underline', 'list', 'bullet', 'link'];


  return (
    <Modal title="Edit Task" activeModal={isOpen} onClose={onClose} unmountOnClose={true}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Textinput
          name="task_title"
          label="Task Title"
          type="text"
          register={register}
          error={errors.task_title}
          placeholder="Enter task title"
          className="h-[48px]"
        />

        {/* ReactQuill for Description */}
        <FormGroup label="Description" error={errors.task_description}>
          <input type="hidden" {...register("task_description")} /> {/* For RHF */}
          <ReactQuill
            theme="snow"
            value={quillDescription}
            onChange={setQuillDescription}
            modules={quillModules}
            formats={quillFormats}
            placeholder="Enter task description..."
            className={`h-32 ${errors.task_description ? 'ql-error border-danger-500' : ''}`}
            readOnly={isSubmitting}
          />
           {/* Error message is handled by FormGroup or you can add it manually */}
        </FormGroup>

        <div className="grid lg:grid-cols-2 gap-4 grid-cols-1">
          <FormGroup label="Due Date (Optional)" error={errors.due_date} className='mt-12'>
            <Controller
              name="due_date"
              control={control}
              render={({ field }) => (
                <Flatpickr
                  {...field}
                  className="form-control h-[48px]"
                  placeholder="YYYY-MM-DD"
                  options={{ altInput: true, altFormat: "F j, Y", dateFormat: "Y-m-d" }}
                  value={field.value}
                  onChange={(date) => field.onChange(date[0] || null)} // Ensure null if cleared
                />
              )}
            />
          </FormGroup>
          <FormGroup label="Priority" error={errors.priority} className='mt-12'>
            <Controller
              name="priority"
              control={control}
              render={({ field }) => (
                <select {...field} className="form-control h-[48px] dark:bg-slate-700 dark:text-slate-300">
                  <option value="Low">Low</option>
                  <option value="Normal">Normal</option>
                  <option value="High">High</option>
                  <option value="Urgent">Urgent</option>
                </select>
              )}
            />
          </FormGroup>
        </div>

        {/* Attachments Section - Themed */}
        <FormGroup label="Attachments (Optional)">
            <div className="mb-2">
              <label className="flex items-center justify-center w-full px-3 py-4 border-2 border-slate-300 dark:border-slate-600 border-dashed rounded-md cursor-pointer bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors">
                <div className="text-center">
                    {/* Cloud Upload Icon or similar */}
                    <svg className="w-6 h-6 text-slate-400 dark:text-slate-500 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                  <span className="text-sm text-slate-600 dark:text-slate-300">Click to upload or drag & drop</span>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Max 10MB per file</p>
                </div>
                <input type="file" multiple onChange={handleFileSelect} className="hidden" disabled={isSubmitting} accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv" />
              </label>
            </div>

            {/* Existing Attachments */}
            {currentAttachments.length > 0 && (
              <div className="space-y-1 mb-3">
                <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Current files:</p>
                {currentAttachments.map((file) => (
                  <div key={`existing-${file.id}`} className="flex items-center justify-between p-2 bg-slate-100 dark:bg-slate-700/50 rounded text-xs">
                    <div className="flex items-center space-x-2 truncate">
                      {getFileIcon(file)}
                      <span className="text-slate-700 dark:text-slate-300 truncate" title={file.file_name}>{file.file_name}</span>
                      <span className="text-slate-500 dark:text-slate-400">({formatFileSize(file.file_size)})</span>
                    </div>
                    <button type="button" onClick={() => removeExistingAttachment(file.id)} className="text-danger-500 hover:text-danger-700 p-0.5" disabled={isSubmitting}>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* New Attachments */}
            {newAttachments.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-slate-600 dark:text-slate-400">New files to upload:</p>
                {newAttachments.map((file, index) => (
                  <div key={`new-${index}`} className="flex items-center justify-between p-2 bg-slate-100 dark:bg-slate-700/50 rounded text-xs">
                    <div className="flex items-center space-x-2 truncate">
                      {getFileIcon(file)}
                      <span className="text-slate-700 dark:text-slate-300 truncate" title={file.name}>{file.name}</span>
                      <span className="text-slate-500 dark:text-slate-400">({formatFileSize(file.size)})</span>
                    </div>
                    <button type="button" onClick={() => removeNewAttachment(file)} className="text-danger-500 hover:text-danger-700 p-0.5" disabled={isSubmitting}>
                       <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
        </FormGroup>


        {/* Buttons - Themed */}
        <div className="ltr:text-right rtl:text-left pt-2 space-x-2">
            <Button
                text="Cancel"
                type="button"
                className="btn-outline-secondary"
                onClick={onClose}
                disabled={isSubmitting}
            />
            <Button
                text={isSubmitting ? "Saving..." : "Save Changes"}
                type="submit"
                className="btn-dark"
                isLoading={isSubmitting} // Assuming Button component handles isLoading prop
                disabled={isSubmitting}
            />
        </div>
      </form>
    </Modal>
  );
};

export default EditTaskModal;
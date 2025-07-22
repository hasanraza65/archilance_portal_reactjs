// src/pages/Brief-task/EditBriefModal.jsx
// (Keep imports and helper functions as they are)
import React, { useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import { toast } from 'react-toastify';

import Modal from "@/components/ui/Modal";
import FormGroup from "@/components/ui/FormGroup";
import Flatpickr from "react-flatpickr";
import Button from "@/components/ui/Button";
import { getApiPrefix } from "@/pages/utility/apiHelper";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const getFileIcon = (fileType, isSmall = false) => {
    const iconSizeClass = isSmall ? "w-4 h-4" : "w-5 h-5";
    if (fileType?.startsWith('image/')) {
        return (
            <svg className={`${iconSizeClass} text-green-500`} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
            </svg>
        );
    } else if (fileType === 'application/pdf') {
        return (
            <svg className={`${iconSizeClass} text-red-500`} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
            </svg>
        );
    }
    return (
        <svg className={`${iconSizeClass} text-blue-500`} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
        </svg>
    );
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
const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const ALLOWED_MIME_TYPES = [
    "image/jpeg", "image/png", "image/gif", "image/webp", "application/pdf",
    "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/plain", "text/csv",
];
const ALLOWED_EXTENSIONS_MAP = {
    jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", gif: "image/gif", webp: "image/webp",
    pdf: "application/pdf", doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    xls: "application/vnd.ms-excel",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    txt: "text/plain", csv: "text/csv",
};
const ACCEPT_STRING = Object.keys(ALLOWED_EXTENSIONS_MAP).map(ext => `.${ext}`).join(",") + "," + ALLOWED_MIME_TYPES.join(",");


const EditBriefModal = ({ isOpen, onClose, onBriefUpdated, briefData, projectId, getAttachmentUrl }) => {
    const [quillDescription, setQuillDescription] = useState('');
    const [newAttachments, setNewAttachments] = useState([]);
    const [existingAttachments, setExistingAttachments] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [attachmentIdsToDelete, setAttachmentIdsToDelete] = useState([]);

    const FormValidationSchema = yup.object({
        brief_description: yup.string().nullable().default(''), // Allow null from Quill, default to empty string
        brief_date: yup.date().required("Brief date is required").typeError("Invalid date format"),
    }).required();

    const {
        register, control, handleSubmit, setValue, reset,
        formState: { errors },
    } = useForm({
        resolver: yupResolver(FormValidationSchema),
        mode: "onChange",
        defaultValues: { brief_description: '', brief_date: null }
    });

    useEffect(() => {
        // Ensure quillDescription is a string before setting it to form value
        setValue("brief_description", typeof quillDescription === 'string' ? quillDescription : '', { shouldValidate: true, shouldDirty: true });
    }, [quillDescription, setValue]);

    useEffect(() => {
        if (isOpen && briefData) {
            const description = briefData.brief_description || '';
            const date = briefData.brief_date ? new Date(briefData.brief_date) : null;
            setQuillDescription(description);
            setValue("brief_description", description);
            setValue("brief_date", date);
            setExistingAttachments((briefData.attachments || []).map(att => ({
                ...att,
                file_type: att.file_type || (att.file_name ? (ALLOWED_EXTENSIONS_MAP[att.file_name.split('.').pop().toLowerCase()] || 'application/octet-stream') : 'application/octet-stream')
            })));
            setNewAttachments([]);
            setAttachmentIdsToDelete([]);
        }
    }, [isOpen, briefData, setValue]);

    useEffect(() => {
        if (!isOpen) {
            reset();
            setQuillDescription('');
            newAttachments.forEach(att => {
                if (att.previewUrl && att.previewUrl.startsWith('blob:')) URL.revokeObjectURL(att.previewUrl);
            });
            setNewAttachments([]);
            setExistingAttachments([]);
            setAttachmentIdsToDelete([]);
        }
    }, [isOpen, reset, newAttachments]);

    const handleFileSelect = (e) => {
        const files = Array.from(e.target.files);
        const maxSize = 10 * 1024 * 1024; // 10MB

        const validFiles = files.filter(file => {
            if (file.size > maxSize) {
                toast.error(`File ${file.name} is too large (max 10MB).`);
                return false;
            }
            const fileExtension = file.name.split(".").pop().toLowerCase();
            const mimeTypeFromExt = ALLOWED_EXTENSIONS_MAP[fileExtension];
            
            if (ALLOWED_MIME_TYPES.includes(file.type) || (mimeTypeFromExt && ALLOWED_MIME_TYPES.includes(mimeTypeFromExt))) {
                return true;
            }
            toast.error(`File type of ${file.name} (${file.type || "unknown type"}) is not allowed.`);
            return false;
        });

        const newFileObjects = validFiles.map(file => ({
            file,
            previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
            tempId: `new-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` 
        }));

        setNewAttachments(prev => [...prev, ...newFileObjects]);
        e.target.value = '';
    };

    const removeNewAttachment = (tempIdToRemove) => {
        setNewAttachments(prev => {
            const attachmentToRemove = prev.find(att => att.tempId === tempIdToRemove);
            if (attachmentToRemove?.previewUrl && attachmentToRemove.previewUrl.startsWith('blob:')) {
                URL.revokeObjectURL(attachmentToRemove.previewUrl);
            }
            return prev.filter(att => att.tempId !== tempIdToRemove);
        });
    };

    const toggleDeleteExistingAttachment = (attachmentId) => {
        setAttachmentIdsToDelete(prevIds =>
            prevIds.includes(attachmentId)
                ? prevIds.filter(id => id !== attachmentId)
                : [...prevIds, attachmentId]
        );
    };

    const onSubmitForm = async (data) => {
        if (!briefData || !briefData.id) {
            toast.error('Brief data or ID is missing.');
            return;
        }
        if (!projectId || isNaN(parseInt(String(projectId)))) {
            toast.error("Project ID is missing or invalid.");
            return;
        }

        const descriptionToSubmit = data.brief_description || ''; // Ensure it's a string

        const finalKeptExistingAttachmentsCount = existingAttachments.filter(att => !attachmentIdsToDelete.includes(att.id)).length;
        if (!descriptionToSubmit.trim() && finalKeptExistingAttachmentsCount === 0 && newAttachments.length === 0) {
            toast.error("Brief cannot be empty if there are no attachments.");
            return;
        }

        setIsSubmitting(true);
        const token = Cookies.get("token");
        if (!token) { 
            toast.error("Authentication required.");
            setIsSubmitting(false);
            return;
        }

        try {
            const formData = new FormData();
            formData.append('_method', 'PUT');
            formData.append('project_id', String(projectId));
            formData.append('brief_description', descriptionToSubmit); // Use sanitized description

            if (data.brief_date) {
                formData.append('brief_date', new Date(data.brief_date).toISOString().split('T')[0]);
            } else {
                 // If your API expects an empty string or null to clear the date, handle accordingly
                 // For now, if date is cleared, it won't be sent.
                 // If backend expects it, you might do: formData.append('brief_date', '');
            }

            newAttachments.forEach((attObject) => {
                formData.append('attachments[]', attObject.file);
            });

            if (attachmentIdsToDelete.length > 0) {
                attachmentIdsToDelete.forEach(id => {
                    formData.append('delete_attachments[]', String(id));
                });
            }

            // This is line ~208 where the error was reported
              const apiPath = getApiBasePathForRole("/project-brief");
            const response = await fetch(`${import.meta.env.VITE_BACKEND_BASE_URL}${apiPath}/${briefData.id}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
                body: formData,
            });
            const responseData = await response.json().catch(() => ({ message: "Could not parse server response." })); // More robust parsing

            if (!response.ok) {
                let detailedMessage = responseData.message || `Failed to update brief (status ${response.status}).`;
                if (responseData.errors) {
                    const firstErrorKey = Object.keys(responseData.errors)[0];
                    if (firstErrorKey && responseData.errors[firstErrorKey]?.length > 0) {
                        detailedMessage = responseData.errors[firstErrorKey][0];
                    }
                }
                throw new Error(detailedMessage);
            }
            toast.success(responseData.message || "Project brief updated successfully!");
            if (onBriefUpdated) onBriefUpdated();
            onClose();
        } catch (error) {
            toast.error(error.message || "An unexpected error occurred while updating brief.");
            console.error("Error during brief update:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const quillModules = { toolbar: [ [{ 'header': [1, 2, false] }], ['bold', 'italic', 'underline'], [{ 'list': 'ordered' }, { 'list': 'bullet' }], ['link', 'clean'] ] };
    const quillFormats = ['header', 'bold', 'italic', 'underline', 'list', 'bullet', 'link'];

    return (
        <Modal title="Edit Project Brief" activeModal={isOpen} onClose={onClose} unmountOnClose={true}>
            <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-5">
                <FormGroup label="Brief Description" error={errors.brief_description}>
                     {/* Hidden input for react-hook-form to track quill's value */}
                    <input type="hidden" {...register("brief_description")} />
                    <ReactQuill 
                        theme="snow" 
                        value={quillDescription} 
                        onChange={setQuillDescription} 
                        modules={quillModules} 
                        formats={quillFormats} 
                        placeholder="Enter brief details..." 
                        className={`h-32 ${errors.brief_description ? 'ql-error border-danger-500' : 'dark:border-slate-600'}`} 
                        readOnly={isSubmitting} 
                    />
                </FormGroup>
                <FormGroup label="Brief Date" error={errors.brief_date} className='mt-12'>
                    <Controller 
                        name="brief_date" 
                        control={control} 
                        render={({ field }) => ( 
                            <Flatpickr 
                                {...field} 
                                className="form-control h-[48px] dark:bg-slate-700 dark:border-slate-600 dark:text-slate-300" 
                                placeholder="Select date" 
                                options={{ altInput: true, altFormat: "F j, Y", dateFormat: "Y-m-d" }} 
                                value={field.value} 
                                onChange={(date) => field.onChange(date[0] || null)} 
                                disabled={isSubmitting} 
                            /> 
                        )}
                    />
                </FormGroup>

                {/* Current Attachments Display */}
                {existingAttachments.length > 0 && (
                    <FormGroup label="Current Attachments">
                        <div className="space-y-2">
                            {existingAttachments.map((att) => {
                                const isMarkedForDelete = attachmentIdsToDelete.includes(att.id);
                                return (
                                    <div 
                                        key={`existing-${att.id}`} 
                                        className={`flex items-center justify-between p-2.5 rounded-lg border transition-all duration-150 ease-in-out 
                                            ${isMarkedForDelete 
                                                ? 'bg-red-50 dark:bg-red-900/30 border-red-300 dark:border-red-700 opacity-70' 
                                                : 'bg-slate-100 dark:bg-slate-700/60 border-slate-200 dark:border-slate-600'
                                            }`}
                                    >
                                        <div className="flex items-center space-x-2.5 min-w-0">
                                            <div className={`flex-shrink-0 w-8 h-8 flex items-center justify-center rounded
                                                ${isMarkedForDelete ? 'bg-red-100 dark:bg-red-800' : 'bg-slate-200 dark:bg-slate-600'}`}>
                                                {getFileIcon(att.file_type, true)} 
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <a
                                                    href={getAttachmentUrl(att.file_path)}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className={`text-sm font-medium hover:underline truncate block
                                                        ${isMarkedForDelete 
                                                            ? 'text-red-700 dark:text-red-300 line-through' 
                                                            : 'text-blue-600 dark:text-blue-400'
                                                        }`}
                                                    title={att.file_name || 'Attachment'}
                                                >
                                                    {att.file_name || 'Attachment'}
                                                </a>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => toggleDeleteExistingAttachment(att.id)}
                                            className={`ml-2 p-1.5 rounded-full flex-shrink-0
                                                ${isMarkedForDelete 
                                                    ? 'text-green-600 hover:bg-green-100 dark:hover:bg-green-900/50' 
                                                    : 'text-danger-500 hover:bg-danger-100 dark:hover:bg-danger-900/30'
                                                }`}
                                            disabled={isSubmitting}
                                            title={isMarkedForDelete ? "Undo Mark for Deletion" : "Mark for Deletion"}
                                        >
                                            {isMarkedForDelete ? (
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-4-4"></path></svg>
                                            ) : (
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                                            )}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </FormGroup>
                )}

                {/* New File Attachment Section */}
                 <FormGroup label="Add New Attachments">
                    <div className="mb-3">
                        <label className={`flex flex-col items-center justify-center w-full p-4 border-2 border-slate-300 dark:border-slate-600 border-dashed rounded-lg cursor-pointer bg-slate-50 dark:bg-slate-700/30 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}>
                            <svg className="w-8 h-8 text-slate-400 dark:text-slate-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Click to upload or drag & drop</span>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Max 10MB per file. Allowed types: images, PDF, Docs, Sheets, TXT, CSV</p>
                            <input type="file" multiple onChange={handleFileSelect} className="hidden" disabled={isSubmitting} accept={ACCEPT_STRING} />
                        </label>
                    </div>

                    {newAttachments.length > 0 && (
                        <div className="space-y-2 pt-2">
                            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">New files to upload:</p>
                            {newAttachments.map((attObject) => (
                                <div key={attObject.tempId} className="flex items-center justify-between p-2.5 bg-green-50 dark:bg-green-900/30 rounded-lg border border-green-200 dark:border-green-700">
                                    <div className="flex items-center space-x-2.5 min-w-0">
                                        <div className="flex-shrink-0">
                                            {attObject.file.type.startsWith('image/') && attObject.previewUrl ? (
                                                <img src={attObject.previewUrl} alt={attObject.file.name} className="w-9 h-9 object-cover rounded border border-slate-200 dark:border-slate-600" />
                                            ) : (
                                                <div className="w-9 h-9 flex items-center justify-center bg-slate-200 dark:bg-slate-600 rounded">
                                                    {getFileIcon(attObject.file.type, true)}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate" title={attObject.file.name}>
                                                {attObject.file.name}
                                            </p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                                {formatFileSize(attObject.file.size)}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => removeNewAttachment(attObject.tempId)}
                                        className="ml-2 p-1.5 text-danger-500 hover:text-danger-700 hover:bg-danger-100 dark:hover:bg-danger-900/30 rounded-full flex-shrink-0"
                                        disabled={isSubmitting}
                                        aria-label="Remove new attachment"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </FormGroup>

                <div className="ltr:text-right rtl:text-left pt-3 space-x-2.5">
                    <Button text="Cancel" type="button" className="btn-outline-secondary" onClick={onClose} disabled={isSubmitting} />
                    <Button text={isSubmitting ? "Updating..." : "Update Brief"} type="submit" className="btn-dark" isLoading={isSubmitting} disabled={isSubmitting || !quillDescription?.trim() && existingAttachments.filter(att => !attachmentIdsToDelete.includes(att.id)).length === 0 && newAttachments.length === 0} />
                </div>
            </form>
        </Modal>
    );
};

export default EditBriefModal;
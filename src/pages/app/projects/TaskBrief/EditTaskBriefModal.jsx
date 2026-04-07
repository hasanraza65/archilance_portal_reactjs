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

// Helper Functions
const getApiBasePathForRole = (basePath) => {
  const role = getApiPrefix();
  const cleanBasePath = basePath.startsWith('/') ? basePath : `/${basePath}`;
  return role ? `/api/${role}${cleanBasePath}` : `/api/admin${cleanBasePath}`;
};

const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const getFileIcon = (fileType, isSmall = false) => {
    const iconSizeClass = isSmall ? "w-4 h-4" : "w-5 h-5";
    if (fileType?.startsWith('image/')) {
        return <svg className={`${iconSizeClass} text-green-500`} fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" /></svg>;
    } else if (fileType === 'application/pdf') {
        return <svg className={`${iconSizeClass} text-red-500`} fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" /></svg>;
    }
    return <svg className={`${iconSizeClass} text-blue-500`} fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" /></svg>;
};

const getAttachmentUrl = (filePath, createdAt = null) => {
    const backendBaseUrl = import.meta.env.VITE_BACKEND_BASE_URL;
    if (!backendBaseUrl || !filePath) return "#";
    const cleanBaseUrl = backendBaseUrl.replace(/\/$/, "");
    const cleanFilePath = filePath.replace(/^\//, "");
    
    const cutoffDate = new Date("2026-01-10T00:00:00.000Z");
    const attachmentCreatedAt = createdAt ? new Date(createdAt) : null;
    
    if (attachmentCreatedAt && attachmentCreatedAt >= cutoffDate) {
        return `${cleanBaseUrl}/onedrive-image?path=${cleanFilePath}`;
    }
    
    return `${cleanBaseUrl}/storage/${cleanFilePath}`;
};

const EditTaskBriefModal = ({ isOpen, onClose, onTaskBriefUpdated, briefData, taskId }) => {
    const [quillDescription, setQuillDescription] = useState('');
    const [newAttachments, setNewAttachments] = useState([]);
    const [existingAttachments, setExistingAttachments] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [attachmentIdsToDelete, setAttachmentIdsToDelete] = useState([]);

    const FormValidationSchema = yup.object({
        brief_description: yup.string().nullable().default(''),
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
        setValue("brief_description", quillDescription, { shouldValidate: true, shouldDirty: true });
    }, [quillDescription, setValue]);

    useEffect(() => {
        if (isOpen && briefData) {
            const description = briefData.brief_description || '';
            const date = briefData.brief_date ? new Date(briefData.brief_date) : null;
            setQuillDescription(description);
            setValue("brief_description", description);
            setValue("brief_date", date);
            setExistingAttachments(briefData.attachments || []);
            setNewAttachments([]);
            setAttachmentIdsToDelete([]);
        }
    }, [isOpen, briefData, setValue]);
    
    const handleFileSelect = (e) => {
        const files = Array.from(e.target.files);
        setNewAttachments(prev => [...prev, ...files]);
        e.target.value = '';
    };

    const removeNewAttachment = (indexToRemove) => {
        setNewAttachments(prev => prev.filter((_, index) => index !== indexToRemove));
    };

    const toggleDeleteExistingAttachment = (attachmentId) => {
        setAttachmentIdsToDelete(prevIds =>
            prevIds.includes(attachmentId)
                ? prevIds.filter(id => id !== attachmentId)
                : [...prevIds, attachmentId]
        );
    };

    const onSubmitForm = async (data) => {
        if (!briefData || !briefData.id || !taskId) {
            toast.error('Brief or Task ID is missing.');
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
            formData.append('task_id', String(taskId));
            formData.append('brief_description', data.brief_description || '');
            if (data.brief_date) {
                formData.append('brief_date', new Date(data.brief_date).toISOString().split('T')[0]);
            }
            newAttachments.forEach((file) => {
                formData.append('attachments[]', file);
            });
            if (attachmentIdsToDelete.length > 0) {
                attachmentIdsToDelete.forEach(id => {
                    formData.append('delete_attachments[]', String(id));
                });
            }

            const apiPath = getApiBasePathForRole("/task-brief");
            const response = await fetch(`${import.meta.env.VITE_BACKEND_BASE_URL}${apiPath}/${briefData.id}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
                body: formData,
            });

            const responseData = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(responseData.message || "Failed to update brief.");
            }
            
            toast.success("Task brief updated successfully!");
            if (onTaskBriefUpdated) {
                onTaskBriefUpdated();
            }
            onClose();
        } catch (error) {
            toast.error(error.message || "An unexpected error occurred.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const quillModules = { toolbar: [ [{ 'header': [1, 2, false] }], ['bold', 'italic', 'underline'], [{ 'list': 'ordered' }, { 'list': 'bullet' }], ['link', 'clean'] ] };
    const quillFormats = ['header', 'bold', 'italic', 'underline', 'list', 'bullet', 'link'];

    return (
        <Modal title="Edit Task Brief" activeModal={isOpen} onClose={onClose} unmountOnClose={true}>
            <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-5">
                <FormGroup label="Brief Description" error={errors.brief_description} className="mt-2">
                    <input type="hidden" {...register("brief_description")} />
                    <ReactQuill 
                        theme="snow" 
                        value={quillDescription} 
                        onChange={setQuillDescription} 
                        modules={quillModules} 
                        formats={quillFormats} 
                        placeholder="Enter brief details..." 
                        className="h-32 mb-12"
                        readOnly={isSubmitting} 
                    />
                </FormGroup>
                <FormGroup label="Brief Date" error={errors.brief_date}>
                    <Controller 
                        name="brief_date" 
                        control={control} 
                        render={({ field }) => ( 
                            <Flatpickr 
                                {...field} 
                                className="form-control h-[48px]" 
                                placeholder="Select date" 
                                options={{ altInput: true, altFormat: "F j, Y", dateFormat: "Y-m-d" }} 
                                value={field.value} 
                                onChange={(date) => field.onChange(date[0] || null)} 
                                disabled={isSubmitting} 
                            /> 
                        )}
                    />
                </FormGroup>

                {existingAttachments.length > 0 && (
                    <FormGroup label="Current Attachments">
                        <div className="space-y-2">
                            {existingAttachments.map((att) => {
                                const isMarkedForDelete = attachmentIdsToDelete.includes(att.id);
                                return (
                                    <div key={`existing-${att.id}`} className={`flex items-center justify-between p-2.5 rounded-lg border transition-all duration-150 ${isMarkedForDelete ? 'bg-red-50 border-red-300' : 'bg-slate-100 border-slate-200'}`}>
                                        <div className="flex items-center space-x-2.5 min-w-0">
                                            <div className="flex-shrink-0">{getFileIcon(att.file_type, true)}</div>
                                            <a href={getAttachmentUrl(att.file_path, att.created_at)} target="_blank" rel="noopener noreferrer" className={`text-sm font-medium hover:underline truncate block ${isMarkedForDelete ? 'text-red-700 line-through' : 'text-blue-600'}`} title={att.file_name}>
                                                {att.file_name || 'Attachment'}
                                            </a>
                                        </div>
                                        <button type="button" onClick={() => toggleDeleteExistingAttachment(att.id)} className={`ml-2 p-1.5 rounded-full flex-shrink-0 ${isMarkedForDelete ? 'text-green-600 hover:bg-green-100' : 'text-danger-500 hover:bg-danger-100'}`} disabled={isSubmitting} title={isMarkedForDelete ? "Undo Mark for Deletion" : "Mark for Deletion"}>
                                            {isMarkedForDelete ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-4-4"></path></svg> : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </FormGroup>
                )}

                 <FormGroup label="Add New Attachments">
                    <label className={`flex flex-col items-center justify-center w-full p-4 border-2 border-slate-300 border-dashed rounded-lg cursor-pointer hover:bg-slate-100 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}>
                        <svg className="w-8 h-8 text-slate-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                        <span className="text-sm font-medium text-slate-600">Click to upload files</span>
                        <input type="file" multiple onChange={handleFileSelect} className="hidden" disabled={isSubmitting} />
                    </label>
                    {newAttachments.length > 0 && (
                        <div className="space-y-2 pt-2">
                            <p className="text-sm font-medium text-slate-700">New files to upload:</p>
                            {newAttachments.map((file, index) => (
                                <div key={index} className="flex items-center justify-between p-2.5 bg-green-50 rounded-lg border border-green-200">
                                    <div className="flex items-center space-x-2.5 min-w-0">
                                        <div className="flex-shrink-0">{getFileIcon(file.type, true)}</div>
                                        <p className="text-sm font-medium text-slate-800 truncate" title={file.name}>{file.name}</p>
                                        <p className="text-xs text-slate-500">({formatFileSize(file.size)})</p>
                                    </div>
                                    <button type="button" onClick={() => removeNewAttachment(index)} className="ml-2 p-1.5 text-danger-500 hover:bg-danger-100 rounded-full flex-shrink-0" disabled={isSubmitting}>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </FormGroup>

                <div className="ltr:text-right rtl:text-left pt-3 space-x-2.5">
                    <Button text="Cancel" type="button" className="btn-outline-secondary" onClick={onClose} disabled={isSubmitting} />
                    <Button text={isSubmitting ? "Updating..." : "Update Brief"} type="submit" className="btn-dark" isLoading={isSubmitting} />
                </div>
            </form>
        </Modal>
    );
};

export default EditTaskBriefModal;
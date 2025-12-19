import React, { useState, useRef, useEffect } from "react";
import {
    MessageCircle,
    Paperclip,
    Send,
    Loader,
    ImageIcon,
    FileText,
    Edit,
    Trash2,
    XCircle,
    Undo2,
} from "lucide-react";
import Swal from "sweetalert2";

const CustomerConversationBox = ({
    messages,
    newMessage,
    setNewMessage,
    attachments,
    setAttachments,
    onSendMessage,
    onUpdateMessage,
    onDeleteMessage,
    isSending,
    isLoading,
    error,
    currentUserId,
    apiBaseUrl,
}) => {
    const fileInputRef = useRef(null);
    const chatEndRef = useRef(null);
    const chatContainerRef = useRef(null); // Added ref for container
    const [editingMessage, setEditingMessage] = useState(null);
    const [editedText, setEditedText] = useState("");
    const [newAttachmentsForEdit, setNewAttachmentsForEdit] = useState([]);
    const [attachmentIdsToDelete, setAttachmentIdsToDelete] = useState([]);
    const [isProcessingAction, setIsProcessingAction] = useState(false);
    const [mobileActionMessageId, setMobileActionMessageId] = useState(null);

    // Auto-scroll to bottom directly using scrollTop
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages]);

    const STORAGE_BASE_URL = `${apiBaseUrl}/storage/`;

    const formatTime = (dateString) =>
        new Date(dateString).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
        });

    const getFileIcon = (fileName) => {
        const ext = fileName?.split(".").pop().toLowerCase() || "";
        if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext))
            return <ImageIcon className="w-6 h-6 text-green-500" />;
        if (ext === "pdf") return <FileText className="w-6 h-6 text-red-500" />;
        return <FileText className="w-6 h-6 text-blue-500" />;
    };

    const handleFileSelect = (e, isEdit = false) => {
        const targetFiles = Array.from(e.target.files).filter((file) => {
            if (file.size > 10 * 1024 * 1024) {
                alert(`${file.name} is too large (max 10MB).`);
                return false;
            }
            return true;
        });
        const newAtts = targetFiles.map((file) => ({
            file,
            preview: URL.createObjectURL(file),
            id: `cust-${isEdit ? "edit" : "new"}-${Date.now()}-${file.name}`,
        }));
        if (isEdit) {
            setNewAttachmentsForEdit((prev) => [...prev, ...newAtts]);
        } else {
            setAttachments((prev) => [...prev, ...newAtts]);
        }
        e.target.value = "";
    };

    const removeAttachment = (id, isEdit = false) => {
        const [getter, setter] = isEdit
            ? [newAttachmentsForEdit, setNewAttachmentsForEdit]
            : [attachments, setAttachments];
        setter((prev) => {
            const att = prev.find((a) => a.id === id);
            if (att?.preview) URL.revokeObjectURL(att.preview);
            return prev.filter((a) => a.id !== id);
        });
    };

    const handleStartEdit = (message) => {
        setEditingMessage(message);
        setEditedText(message.message || "");
        setNewAttachmentsForEdit([]);
        setAttachmentIdsToDelete([]);
    };

    const handleCancelEdit = () => setEditingMessage(null);

    const toggleDeleteExistingAttachment = (id) =>
        setAttachmentIdsToDelete((prev) =>
            prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
        );

    const handleSaveEdit = async () => {
        setIsProcessingAction(true);
        const success = await onUpdateMessage(
            editingMessage.id,
            editedText,
            newAttachmentsForEdit.map((a) => a.file),
            attachmentIdsToDelete
        );
        if (success) handleCancelEdit();
        setIsProcessingAction(false);
    };

    const handleDelete = async (messageId) => {
        const result = await Swal.fire({
            title: "Are you sure?",
            text: "Delete this message from customer chat?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "Yes, delete it!",
        });
        if (result.isConfirmed) {
            setIsProcessingAction(true);
            await onDeleteMessage(messageId);
            setIsProcessingAction(false);
        }
    };

    const renderAttachment = (url, name, isPreview = false) => {
        const isImage = ["jpg", "jpeg", "png", "gif", "webp"].includes(
            name.split(".").pop().toLowerCase()
        );
        const finalUrl = isPreview ? url : `${STORAGE_BASE_URL}${url}`;
        return (
            <a
                href={finalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-1.5 bg-black/5 rounded-lg hover:bg-black/10 transition-colors"
            >
                {isImage ? (
                    <img
                        src={finalUrl}
                        alt={name}
                        className="w-20 h-20 object-cover rounded-md border border-white/20"
                    />
                ) : (
                    <div className="w-20 h-20 flex flex-col items-center justify-center bg-white/10 rounded-md p-1">
                        {getFileIcon(name)}
                        <p className="text-[10px] text-center mt-2 break-all line-clamp-2">
                            {name}
                        </p>
                    </div>
                )}
            </a>
        );
    };

    const renderMessageContent = (message, isSentByMe) => (
        <div className="w-full">
            {message.message && (
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {message.message}
                </p>
            )}
            {message.attachments?.length > 0 && (
                <div
                    className={`grid grid-cols-2 sm:grid-cols-3 gap-2 ${message
                        ? `mt-3 pt-3 border-t ${isSentByMe ? "border-white/20" : "border-gray-200/80"
                        }`
                        : ""
                        }`}
                >
                    {message.attachments.map((att) => (
                        <div key={att.id}>
                            {renderAttachment(
                                att.file_path,
                                att.file_name,
                                att.file_path.startsWith("blob:")
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    const renderEditView = () => (
        <div className="w-full space-y-3">
            <textarea
                value={editedText}
                onChange={(e) => setEditedText(e.target.value)}
                className="w-full bg-white/20 text-white rounded-lg p-2 text-sm focus:outline-none"
                rows={3}
            />
            {editingMessage.attachments?.length > 0 && (
                <div>
                    <p className="text-xs font-medium mb-2">Current files:</p>
                    <div className="grid grid-cols-3 gap-2">
                        {editingMessage.attachments.map((att) => {
                            const isMarkedForDeletion = attachmentIdsToDelete.includes(
                                att.id
                            );
                            return (
                                <div key={att.id} className="relative group">
                                    {renderAttachment(att.file_path, att.file_name)}
                                    <button
                                        onClick={() => toggleDeleteExistingAttachment(att.id)}
                                        className={`absolute top-1 right-1 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs shadow-md transition-all ${isMarkedForDeletion
                                            ? "bg-green-500 hover:bg-green-600"
                                            : "bg-red-500 hover:bg-red-600"
                                            }`}
                                    >
                                        {isMarkedForDeletion ? (
                                            <Undo2 size={12} />
                                        ) : (
                                            <Trash2 size={12} />
                                        )}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
            {newAttachmentsForEdit.length > 0 && (
                <div>
                    <p className="text-xs font-medium mb-2">New files to add:</p>
                    <div className="grid grid-cols-3 gap-2">
                        {newAttachmentsForEdit.map((att) => (
                            <div key={att.id} className="relative group">
                                {renderAttachment(att.preview, att.file.name, true)}
                                <button
                                    onClick={() => removeAttachment(att.id, true)}
                                    className="absolute top-1 right-1 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs shadow-md bg-red-500 hover:bg-red-600"
                                >
                                    <XCircle size={12} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            <label className="inline-flex items-center px-3 py-1.5 border border-dashed border-white/50 rounded-lg cursor-pointer hover:bg-white/10 text-xs">
                <Paperclip size={12} className="mr-1.5" />
                Add Files
                <input
                    type="file"
                    multiple
                    onChange={(e) => handleFileSelect(e, true)}
                    className="hidden"
                />
            </label>
            <div className="flex justify-end gap-2 pt-2 border-t border-white/20">
                <button
                    onClick={handleCancelEdit}
                    disabled={isProcessingAction}
                    className="text-xs px-3 py-1 rounded-full bg-gray-500 hover:bg-gray-600 text-white"
                >
                    Cancel
                </button>
                <button
                    onClick={handleSaveEdit}
                    disabled={isProcessingAction}
                    className="text-xs px-3 py-1 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white disabled:opacity-50"
                >
                    {isProcessingAction ? "Saving..." : "Save"}
                </button>
            </div>
        </div>
    );

    const getMessageStyle = (isSentByMe, roleId) => {
        if (isSentByMe) {
            return "bg-gradient-to-br from-indigo-600 to-blue-700 text-white rounded-br-md";
        }
        // Role ID 4 is Customer -> Emerald/Green theme
        if (roleId === 4) {
            return "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-900 dark:text-emerald-100 border border-emerald-200 dark:border-emerald-800 rounded-bl-md";
        }
        // Role ID 2 is Admin -> Purple theme
        if (roleId === 2) {
            return "bg-purple-100 dark:bg-purple-900/30 text-purple-900 dark:text-purple-100 border border-purple-200 dark:border-purple-800 rounded-bl-md";
        }
        // Default (Employee/Other) -> White/Gray theme
        return "bg-white/90 dark:bg-slate-700 text-gray-800 dark:text-slate-200 border border-gray-100 dark:border-slate-600 rounded-bl-md";
    };

    return (
        <div className="bg-white/70 dark:bg-slate-800/70 rounded-2xl shadow-2xl border border-blue-200 dark:border-blue-900/30 h-full flex flex-col overflow-hidden">
            <div className="p-4 sm:p-6 bg-blue-50/50 dark:bg-slate-900 flex-shrink-0">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl text-white">
                            <MessageCircle className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                                Customer Chat
                            </h3>
                        </div>
                    </div>
                </div>
            </div>
            <div
                ref={chatContainerRef} // Attached ref here
                className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 sm:space-y-4"
            >
                {isLoading && (
                    <div className="flex justify-center items-center h-full">
                        <Loader className="w-8 h-8 animate-spin text-blue-600" />
                    </div>
                )}
                {error && (
                    <div className="text-center text-red-500">Error: {error}</div>
                )}
                {!isLoading &&
                    messages.map((message) => {
                        const isSentByMe = message.sender_id === currentUserId;
                        const isEditing =
                            editingMessage && editingMessage.id === message.id;
                        const senderRoleId = message.sender?.user_role;

                        return (
                            <div
                                key={message.id}
                                className={`flex items-end gap-2 sm:gap-3 ${isSentByMe ? "flex-row-reverse" : ""
                                    }`}
                                onClick={() => {
                                    if (window.innerWidth < 640 && isSentByMe && !isEditing) {
                                        setMobileActionMessageId(
                                            mobileActionMessageId === message.id ? null : message.id
                                        );
                                    }
                                }}
                            >
                                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex-shrink-0">
                                    {message.sender?.profile_pic ? (
                                        <img
                                            src={`${STORAGE_BASE_URL}${message.sender.profile_pic}`}
                                            alt={message.sender.name}
                                            className="w-full h-full rounded-full object-cover border-2 border-white shadow-md"
                                        />
                                    ) : (
                                        <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm sm:text-lg border-2 border-white shadow-md">
                                            {message.sender?.name
                                                ? message.sender.name.charAt(0).toUpperCase()
                                                : "?"}
                                        </div>
                                    )}
                                </div>
                                <div
                                    className={`group relative max-w-[85%] sm:max-w-md min-w-[120px] px-4 py-2 sm:px-5 sm:py-3 rounded-2xl shadow-lg ${getMessageStyle(isSentByMe, senderRoleId)}`}
                                >
                                    {isEditing
                                        ? renderEditView()
                                        : renderMessageContent(message, isSentByMe)}
                                    <p
                                        className={`text-[10px] mt-2 text-right ${isSentByMe
                                            ? "text-blue-100"
                                            : "text-gray-500 dark:text-slate-400"
                                            }`}
                                    >
                                        {formatTime(message.created_at)}
                                    </p>
                                    {isSentByMe && !isEditing && (
                                        <div className="absolute top-1 -left-12 flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:flex">
                                            <button
                                                onClick={() => handleStartEdit(message)}
                                                disabled={isProcessingAction}
                                                className="p-1.5 bg-white dark:bg-slate-600 rounded-full shadow-md hover:bg-gray-100 dark:hover:bg-slate-500 disabled:opacity-50"
                                            >
                                                <Edit
                                                    size={12}
                                                    className="text-gray-600 dark:text-slate-200"
                                                />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(message.id)}
                                                disabled={isProcessingAction}
                                                className="p-1.5 bg-white dark:bg-slate-600 rounded-full shadow-md hover:bg-gray-100 dark:hover:bg-slate-500 disabled:opacity-50"
                                            >
                                                <Trash2 size={12} className="text-red-500" />
                                            </button>
                                        </div>
                                    )}
                                    {isSentByMe &&
                                        !isEditing &&
                                        mobileActionMessageId === message.id && (
                                            <div className="sm:hidden flex justify-end gap-2 border-t border-white/20 mt-2 pt-2">
                                                <button
                                                    onClick={() => handleStartEdit(message)}
                                                    disabled={isProcessingAction}
                                                    className="flex items-center gap-1 text-xs text-blue-100 disabled:opacity-50"
                                                >
                                                    <Edit size={14} /> Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(message.id)}
                                                    disabled={isProcessingAction}
                                                    className="flex items-center gap-1 text-xs text-red-200 disabled:opacity-50"
                                                >
                                                    <Trash2 size={14} /> Delete
                                                </button>
                                            </div>
                                        )}
                                </div>
                            </div>
                        );
                    })}
                <div ref={chatEndRef} />
            </div>
            <div className="p-3 sm:p-4 bg-slate-50 dark:bg-slate-900 flex-shrink-0 space-y-3">
                {attachments.length > 0 && (
                    <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2">
                        {attachments.map((att) => (
                            <div key={att.id} className="relative group">
                                {renderAttachment(att.preview, att.file.name, true)}
                                <button
                                    onClick={() => removeAttachment(att.id)}
                                    className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center text-white text-xs shadow-md bg-red-500 hover:bg-red-600"
                                >
                                    <XCircle size={12} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
                <div className="relative">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message to the customer..."
                        className="w-full bg-white dark:bg-slate-700/80 border border-gray-200 dark:border-slate-600 text-gray-800 dark:text-slate-200 rounded-2xl pl-10 sm:pl-12 pr-24 sm:pr-28 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        onKeyPress={(e) =>
                            e.key === "Enter" && !isSending && onSendMessage()
                        }
                        disabled={isSending}
                    />
                    <button
                        onClick={() => fileInputRef.current.click()}
                        className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-slate-600"
                    >
                        <Paperclip className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 dark:text-slate-400" />
                    </button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        multiple
                        hidden
                    />
                    <button
                        onClick={onSendMessage}
                        disabled={
                            isSending || (!newMessage.trim() && attachments.length === 0)
                        }
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-3 sm:px-5 py-2 rounded-xl flex items-center gap-2 font-semibold shadow-lg hover:scale-105 disabled:opacity-50"
                    >
                        {isSending ? (
                            <Loader size={16} className="animate-spin" />
                        ) : (
                            <Send size={16} />
                        )}
                        <span className="hidden sm:inline">Send</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CustomerConversationBox;
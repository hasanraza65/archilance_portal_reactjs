// src/pages/ProjectBriefDetailPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Cookies from 'js-cookie';
import Swal from 'sweetalert2';
import DOMPurify from 'dompurify';
import { getApiPrefix } from "@/pages/utility/apiHelper";

// Helper functions
const getAttachmentUrl = (filePath) => {
    const backendBaseUrl = import.meta.env.VITE_BACKEND_BASE_URL;
    if (!backendBaseUrl || !filePath) return "#";
    const cleanBaseUrl = backendBaseUrl.replace(/\/$/, "");
    const cleanFilePath = filePath.replace(/^\//, "");
    return `${cleanBaseUrl}/storage/${cleanFilePath}`;
};

const isImageFile = (fileType) => {
    if (!fileType) return false;
    return fileType.startsWith("image/");
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

const getFileIcon = (fileType, isSmall = false) => {
    const iconSizeClass = isSmall ? "w-6 h-6" : "w-8 h-8";
    if (fileType?.startsWith('image/')) {
        return null; 
    } else if (fileType === 'application/pdf') {
        return (
            <div className="flex items-center justify-center w-full h-full bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/30 rounded-lg">
                <svg className={`${iconSizeClass} text-red-500`} fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                </svg>
            </div>
        );
    }
    
    return (
        <div className="flex items-center justify-center w-full h-full bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/30 rounded-lg">
            <svg className={`${iconSizeClass} text-blue-500`} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
            </svg>
        </div>
    );
};

const ProjectBriefDetailPage = () => {
    const { briefId } = useParams();
    const navigate = useNavigate();
    const [briefDetails, setBriefDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchBriefDetails = useCallback(async () => {
        console.log(`Fetching details for brief ID: ${briefId}`);
        setLoading(true);
        setError(null);
        const token = Cookies.get("token");

        if (!token) {
            setError("Authentication token not found. Please log in.");
            Swal.fire("Error", "Authentication token not found.", "error").then(() => navigate("/login"));
            setLoading(false);
            return;
        }

        try {
            const apiPath = getApiBasePathForRole("/project-brief");
            const response = await fetch(`${import.meta.env.VITE_BACKEND_BASE_URL}${apiPath}/${briefId}`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/json",
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0',
                },
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: `Server error: ${response.status}` }));
                console.error("API Error Response:", errorData);
                throw new Error(errorData.message || `Error fetching brief: ${response.statusText}`);
            }

            const data = await response.json();
            console.log("API Raw Response Data for Brief Detail:", data);

            const fetchedBrief = data.brief || data.data || data; 
            console.log("Processed fetchedBrief object:", fetchedBrief);
            console.log("Description from fetchedBrief directly:", fetchedBrief?.brief_description);
            console.log("Project ID from fetchedBrief directly:", fetchedBrief?.project_id);

            if (fetchedBrief && typeof fetchedBrief.brief_description !== 'undefined') {
                 setBriefDetails({
                    ...fetchedBrief,
                    sanitized_description: DOMPurify.sanitize(fetchedBrief.brief_description || ""),
                    attachments: (fetchedBrief.attachments || []).map(att => ({
                        ...att,
                        url: getAttachmentUrl(att.file_path),
                        file_type: att.file_type || (att.file_name ? (att.file_name.split('.').pop().toLowerCase() === 'pdf' ? 'application/pdf' : (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(att.file_name.split('.').pop().toLowerCase()) ? `image/${att.file_name.split('.').pop().toLowerCase()}` : 'application/octet-stream')) : 'application/octet-stream')
                    }))
                });
            } else {
                console.error("Brief data structure issue: 'fetchedBrief' or 'fetchedBrief.brief_description' is missing or invalid.", fetchedBrief);
                throw new Error("Brief data format incorrect or critical information missing.");
            }
        } catch (err) {
            console.error("Error fetching or processing brief details:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [briefId, navigate]);

    useEffect(() => {
        if (briefId) {
            fetchBriefDetails();
        } else {
            setError("Brief ID is missing from URL.");
            setLoading(false);
            console.error("Brief ID is missing from URL params.");
        }
    }, [briefId, fetchBriefDetails]);

    useEffect(() => {
        if (briefDetails) {
            console.log("State briefDetails updated:", briefDetails);
            console.log("Sanitized description in state:", briefDetails.sanitized_description);
        }
    }, [briefDetails]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
                <div className="text-center space-y-4">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-white dark:bg-slate-800 rounded-full shadow-lg">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                    <p className="text-lg font-medium text-slate-600 dark:text-slate-300">Loading brief details...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center p-4">
                <div className="max-w-md w-full">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 text-center space-y-6">
                        <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto">
                            <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Oops! Something went wrong</h3>
                            <p className="text-slate-600 dark:text-slate-300">{error}</p>
                        </div>
                        <button 
                            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105" 
                            onClick={() => navigate(-1)}
                        >
                            Go Back
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (!briefDetails) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center p-4">
                <div className="max-w-md w-full">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 text-center space-y-6">
                        <div className="w-20 h-20 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto">
                            <svg className="w-10 h-10 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.034 0-3.952.612-5.531 1.66C4.926 17.917 3 20.186 3 22.5h18c0-2.314-1.926-4.583-3.469-5.84z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Brief Not Found</h3>
                            <p className="text-slate-600 dark:text-slate-300">The brief you are looking for does not exist or could not be loaded.</p>
                        </div>
                        <button 
                            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105" 
                            onClick={() => navigate(-1)}
                        >
                            Go Back
                        </button>
                    </div>
                </div>
            </div>
        );
    }
    
    const descriptionToRender = briefDetails.sanitized_description;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
            {/* Hero Section */}
            <div className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-90"></div>
                <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%27http%3A//www.w3.org/2000/svg%27%3E%3Cg%20fill%3D%27none%27%20fill-rule%3D%27evenodd%27%3E%3Cg%20fill%3D%27%23ffffff%27%20fill-opacity%3D%270.1%27%3E%3Ccircle%20cx%3D%2730%27%20cy%3D%2730%27%20r%3D%274%27/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20"></div>

                <div className="relative container mx-auto px-4 py-16 md:py-20">
                    <div className="text-center space-y-4">
                        <div className="inline-flex items-center bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 text-white/90 text-sm font-medium">
                            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                            </svg>
                            Job Brief
                        </div>
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
                            {briefDetails.brief_title || 'Job Brief Details'}
                        </h1>
                        {briefDetails.brief_date && (
                            <p className="text-xl text-white/80 font-medium">
                                {new Date(briefDetails.brief_date).toLocaleDateString('en-US', { 
                                    year: 'numeric', 
                                    month: 'long', 
                                    day: 'numeric' 
                                })}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="relative -mt-8 container mx-auto px-4 pb-16 space-y-8">
                {/* Project Info Card */}
                {briefDetails.project && briefDetails.project.project_name && (
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                </svg>
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Associated Project</p>
                                <Link 
                                    to={`/project/${briefDetails.project_id}`} 
                                    className="text-lg font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors duration-200"
                                >
                                    {briefDetails.project.project_name}
                                </Link>
                            </div>
                        </div>
                    </div>
                )}

                {/* Description Card */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                    <div className="bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-700 dark:to-slate-600 px-8 py-6 border-b border-slate-200 dark:border-slate-600">
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center">
                            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center mr-3">
                                <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            Brief Description
                        </h2>
                    </div>
                    <div className="p-8">
                        {descriptionToRender && descriptionToRender.replace(/<[^>]*>/g, '').trim().length > 0 ? (
                            <div 
                                className="prose prose-lg prose-slate dark:prose-invert max-w-none leading-relaxed"
                                dangerouslySetInnerHTML={{ __html: descriptionToRender }} 
                            />
                        ) : (
                            <div className="text-center py-12">
                                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                <p className="text-slate-500 dark:text-slate-400 text-lg">No description provided for this brief.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Attachments Card */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                    <div className="bg-gradient-to-r from-slate-50 to-purple-50 dark:from-slate-700 dark:to-slate-600 px-8 py-6 border-b border-slate-200 dark:border-slate-600">
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center">
                            <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/50 rounded-lg flex items-center justify-center mr-3">
                                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                </svg>
                            </div>
                            Attachments
                            {briefDetails.attachments && briefDetails.attachments.length > 0 && (
                                <span className="ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300">
                                    {briefDetails.attachments.length}
                                </span>
                            )}
                        </h2>
                    </div>
                    <div className="p-8">
                        {briefDetails.attachments && briefDetails.attachments.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {briefDetails.attachments.map((att) => (
                                    <a 
                                        key={att.id} 
                                        href={att.url} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="group block bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 border-2 border-slate-200 dark:border-slate-600 hover:border-blue-300 dark:hover:border-blue-500 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
                                    >
                                        <div className="flex flex-col items-center text-center space-y-3">
                                            <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-200 dark:bg-slate-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                                {isImageFile(att.file_type) ? (
                                                    <img 
                                                        src={att.url} 
                                                        alt={att.file_name} 
                                                        className="w-full h-full object-cover rounded-xl" 
                                                    />
                                                ) : (
                                                    getFileIcon(att.file_type, false)
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0 w-full">
                                                <p 
                                                    className="text-sm font-semibold text-slate-700 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200 truncate" 
                                                    title={att.file_name}
                                                >
                                                    {att.file_name || "Attachment"}
                                                </p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                                    Click to view
                                                </p>
                                            </div>
                                        </div>
                                    </a>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                    </svg>
                                </div>
                                <p className="text-slate-500 dark:text-slate-400 text-lg">No attachments for this brief.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Back Button */}
                <div className="flex justify-center pt-8">
                    <button 
                        className="bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white font-medium py-3 px-8 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg" 
                        onClick={() => navigate(-1)}
                    >
                        ← Go Back
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProjectBriefDetailPage;
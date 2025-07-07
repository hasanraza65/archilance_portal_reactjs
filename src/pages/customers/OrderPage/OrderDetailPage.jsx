import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Cookies from 'js-cookie';
import {
  Clock, MessageCircle, CheckCircle, Paperclip, Send, ClipboardList,
  ChevronDown, ChevronUp, Calendar, LayoutGrid, BookText, AlertTriangle,
  Loader, ListTodo, Star, Briefcase, ArrowLeft, Users, TrendingUp,
  Zap, Target, Award, Activity, ChevronLeft, ChevronRight
} from "lucide-react";

// Helper to remove HTML tags for truncation
const stripHtml = (html) => {
  if (!html) return "";
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.textContent || "";
};

// Animated Background Component
const AnimatedBackground = () => (
  <div className="fixed inset-0 -z-10 overflow-hidden">
    <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl animate-pulse" />
    <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-emerald-400/20 to-cyan-600/20 rounded-full blur-3xl animate-pulse delay-1000" />
    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-pink-400/10 to-orange-600/10 rounded-full blur-3xl animate-pulse delay-500" />
  </div>
);

// Component for collapsible requirements with glass morphism
const OrderRequirements = ({ htmlContent }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const textContent = stripHtml(htmlContent);
  const maxLength = 200;
  const isTruncatable = textContent.length > maxLength;

  if (!htmlContent) return null;

  return (
    <div className="backdrop-blur-xl bg-white/70 rounded-2xl shadow-2xl border border-white/20 p-8 mb-8 hover:shadow-3xl transition-all duration-500 hover:-translate-y-1">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl text-white">
            <ClipboardList className="w-6 h-6" />
          </div>
          Project Description
        </h2>
      </div>
      <div
        className={`prose max-w-none text-gray-700 leading-relaxed transition-all duration-700 ease-in-out overflow-hidden ${
          isExpanded ? 'max-h-[1000px] opacity-100' : 'max-h-24 opacity-90'
        }`}
        dangerouslySetInnerHTML={{ 
          __html: isTruncatable && !isExpanded ? `${htmlContent.slice(0, 250)}...` : htmlContent 
        }}
      />
      {isTruncatable && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold mt-4 px-6 py-2 rounded-full text-sm flex items-center gap-2 transition-all duration-300 hover:scale-105 shadow-lg"
        >
          {isExpanded ? "Show Less" : "Show More"}
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      )}
    </div>
  );
};

// Enhanced OrderStatusStep component with animations
const OrderStatusStep = ({ status, text, isLast = false }) => {
  const statusConfig = {
    done: { 
      Icon: <CheckCircle className="w-8 h-8 text-emerald-500" />, 
      textClass: "text-gray-800 font-semibold",
      lineClass: "border-emerald-300" 
    },
    progress: { 
      Icon: <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center animate-pulse">
        <Clock className="w-4 h-4 text-white" />
      </div>, 
      textClass: "text-blue-700 font-bold",
      lineClass: "border-blue-300" 
    },
    pending: { 
      Icon: <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
        <div className="w-4 h-4 rounded-full bg-gray-400"></div>
      </div>, 
      textClass: "text-gray-500",
      lineClass: "border-gray-300" 
    },
  };
  
  const { Icon, textClass, lineClass } = statusConfig[status];

  return (
    <div className="flex items-start group">
      <div className="flex flex-col items-center mr-6 relative">
        <div className="transition-transform duration-300 group-hover:scale-110">
          {Icon}
        </div>
        {!isLast && (
          <div className={`mt-3 h-12 w-px border-l-2 border-dashed ${lineClass} transition-colors duration-300`}></div>
        )}
      </div>
      <div className="pt-1">
        <span className={`text-lg ${textClass} transition-colors duration-300`}>{text}</span>
      </div>
    </div>
  );
};

// ProjectTasksList with Pagination and fixed height
const ProjectTasksList = ({ tasks, apiBaseUrl }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const tasksPerPage = 4;

  if (!tasks || tasks.length === 0) {
    return (
      <div className="backdrop-blur-xl bg-white/70 rounded-2xl shadow-2xl border border-white/20 p-8 text-center flex flex-col justify-center">
        <div className="p-4 bg-gradient-to-br from-gray-500 to-gray-600 rounded-2xl text-white mx-auto mb-4 w-fit">
          <Briefcase className="w-12 h-12" />
        </div>
        <h3 className="text-2xl font-bold text-gray-800 mb-2">No Tasks Assigned</h3>
        <p className="text-gray-500 text-lg">There are currently no tasks for this project.</p>
      </div>
    );
  }

  const indexOfLastTask = currentPage * tasksPerPage;
  const indexOfFirstTask = indexOfLastTask - tasksPerPage;
  const currentTasks = tasks.slice(indexOfFirstTask, indexOfLastTask);
  const totalPages = Math.ceil(tasks.length / tasksPerPage);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Completed': return 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg';
      case 'In Progress': return 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg';
      case 'Todo': return 'bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-lg';
      default: return 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg';
    }
  };

  return (
    <div className="backdrop-blur-xl bg-white/70 rounded-2xl shadow-2xl border border-white/20 flex flex-col overflow-hidden h-full">
      <div className="p-6 bg-gradient-to-r from-slate-50 to-gray-50 flex-shrink-0">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl text-white">
            <ListTodo className="w-6 h-6" />
          </div>
          <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
            Project Tasks
          </h3>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {currentTasks.map((task, index) => (
          <div 
            key={task.id} 
            className="group p-6 bg-white/80 backdrop-blur-sm border border-white/40 rounded-2xl hover:shadow-xl hover:bg-white/90 transition-all duration-300 hover:-translate-y-1"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex justify-between items-start mb-4 gap-4">
              <h4 className="font-bold text-gray-900 text-lg group-hover:text-gray-700 transition-colors">
                {task.task_title}
              </h4>
              <span className={`flex-shrink-0 whitespace-nowrap px-3 py-1 text-sm font-bold rounded-full ${getStatusBadge(task.task_status)} transition-transform duration-300 group-hover:scale-105`}>
                {task.task_status}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2 text-gray-600" title={`${task.attachments.length} attachments`}>
                  <Paperclip size={16} className="text-gray-500" />
                  <span className="font-medium">{task.attachments.length}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600" title={`Priority: ${task.priority}`}>
                  <Star 
                    size={16} 
                    className={`${task.priority === "Urgent" || task.priority === "High" ? "text-red-500" : "text-amber-500"} transition-colors`} 
                  />
                  <span className="font-medium">{task.priority}</span>
                </div>
              </div>
              <div className="flex items-center -space-x-2" title={`Assigned to: ${task.assignees.map(a => a.user.name).join(', ')}`}>
                {task.assignees.map(assignee => (
                  assignee.user.profile_pic ? (
                    <img 
                      key={assignee.id} 
                      src={`${apiBaseUrl}/storage/${assignee.user.profile_pic}`} 
                      alt={assignee.user.name} 
                      className="w-8 h-8 rounded-full border-2 border-white shadow-md hover:scale-110 transition-transform duration-300"
                    />
                  ) : (
                    <div 
                      key={assignee.id} 
                      className="w-8 h-8 rounded-full border-2 border-white bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-sm font-bold text-white shadow-md hover:scale-110 transition-transform duration-300"
                    >
                      {assignee.user.name.charAt(0)}
                    </div>
                  )
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {totalPages > 1 && (
        <div className="flex-shrink-0 p-4 bg-slate-50/50 flex items-center justify-center gap-4 border-t border-white/20">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-lg text-gray-700 font-semibold shadow-md hover:bg-white transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={16} />
            Previous
          </button>
          
          <span className="font-bold text-gray-700">
            {currentPage} / {totalPages}
          </span>

          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-lg text-gray-700 font-semibold shadow-md hover:bg-white transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
};


// Enhanced ConversationBox with modern chat design
const ConversationBox = ({ messages, newMessage, setNewMessage, onSendMessage }) => {
  const otherUserName = "Admin";
  const otherUserAvatar = "/api/placeholder/32/32";
  const currentUserAvatar = "/api/placeholder/32/32";

  return (
    <div className="backdrop-blur-xl bg-white/70 rounded-2xl shadow-2xl border border-white/20 h-full flex flex-col overflow-hidden">
      <div className="p-6 bg-gradient-to-r from-slate-50 to-gray-50 flex-shrink-0">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-br from-green-500 to-teal-600 rounded-xl text-white">
            <MessageCircle className="w-6 h-6" />
          </div>
          <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
            Chat with {otherUserName}
          </h3>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-6 space-y-4 h-96">
        {messages.map((message, index) => (
          <div 
            key={message.id} 
            className={`flex items-end gap-3 ${message.sender === 'buyer' ? 'flex-row-reverse' : ''} animate-fade-in`}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <img 
              src={message.sender === 'buyer' ? currentUserAvatar : otherUserAvatar} 
              alt="avatar" 
              className="w-10 h-10 rounded-full border-2 border-white shadow-lg" 
            />
            <div className={`max-w-md px-6 py-4 rounded-2xl shadow-lg ${
              message.sender === 'buyer' 
                ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white rounded-br-md' 
                : 'bg-white/90 backdrop-blur-sm text-gray-800 rounded-bl-md border border-gray-200'
            } transition-all duration-300 hover:shadow-xl`}>
              <p className="text-sm leading-relaxed">{message.content}</p>
              <p className={`text-xs mt-2 text-right ${
                message.sender === 'buyer' ? 'text-blue-200' : 'text-gray-500'
              }`}>
                {message.time}
              </p>
            </div>
          </div>
        ))}
      </div>
      <div className="p-6 bg-gradient-to-r from-slate-50 to-gray-50 flex-shrink-0">
        <div className="relative">
          <input 
            type="text" 
            value={newMessage} 
            onChange={(e) => setNewMessage(e.target.value)} 
            placeholder="Type your message here..." 
            className="w-full bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl pl-14 pr-32 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-gray-800 placeholder-gray-500" 
            onKeyPress={(e) => e.key === 'Enter' && onSendMessage()} 
          />
          <div className="absolute left-4 top-1/2 -translate-y-1/2">
            <Paperclip className="w-5 h-5 text-gray-400" />
          </div>
          <button 
            onClick={onSendMessage} 
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl transition-all duration-300 flex items-center gap-2 font-semibold shadow-lg hover:shadow-xl hover:scale-105"
          >
            Send <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

// Helper function for timer (unchanged)
const calculateTimeLeft = (dueDate) => {
  const difference = +new Date(dueDate) - +new Date();
  if (difference <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / 1000 / 60) % 60),
    seconds: Math.floor((difference / 1000) % 60),
  };
};

// Main component
const OrderDetailsPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const API_BASE_URL = 'https://demo.aentora.com/backend/public';
  const token = Cookies.get("token");

  const [projectData, setProjectData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeLeft, setTimeLeft] = useState({});

  const [messages, setMessages] = useState([
    { id: 1, sender: "seller", content: "Hello! I've started working on your project. I'll deliver it within the promised timeframe.", time: "2:30 PM" },
    { id: 2, sender: "buyer", content: "Great! Looking forward to seeing the progress. Please keep me updated.", time: "3:15 PM" },
    { id: 3, sender: "seller", content: "Sure! I'll send you a preview by tomorrow. Do you have any specific requirements for the color scheme?", time: "3:45 PM" },
  ]);
  const [newMessage, setNewMessage] = useState("");

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      const message = { 
        id: messages.length + 1, 
        sender: "buyer", 
        content: newMessage, 
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) 
      };
      setMessages([...messages, message]);
      setNewMessage("");
    }
  };

  useEffect(() => {
    if (!token) {
      setError("Authorization Error: No token found. Please log in.");
      setIsLoading(false);
      return;
    }

    if (!id) {
      setError("Error: No Project ID provided in the URL.");
      setIsLoading(false);
      return;
    }

    const fetchProjectDetails = async (projectId) => {
      setIsLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/api/customer/project/${projectId}`, {
          headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.message || `Failed to fetch data. Status: ${response.status}`);
        }

        const data = await response.json();
        setProjectData(data);
        setTimeLeft(calculateTimeLeft(data.due_date));
        setError(null);

      } catch (err) {
        console.error("API Fetch Error:", err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjectDetails(id);
  }, [id, token]);

  useEffect(() => {
    if (!projectData || !timeLeft || (timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.minutes === 0 && timeLeft.seconds === 0)) return;
    const timer = setInterval(() => setTimeLeft(calculateTimeLeft(projectData.due_date)), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, projectData]);

  const getStatusSteps = (status) => {
    const steps = { placed: 'pending', requirements: 'pending', working: 'pending', delivery: 'pending' };
    if (!status) return steps;

    switch (status.toLowerCase()) {
      case 'completed':
      case 'delivered':
        steps.placed = 'done';
        steps.requirements = 'done';
        steps.working = 'done';
        steps.delivery = 'done';
        break;
      case 'in progress':
        steps.placed = 'done';
        steps.requirements = 'done';
        steps.working = 'progress';
        break;
      case 'todo':
        steps.placed = 'done';
        steps.requirements = 'progress';
        break;
      default:
        steps.placed = 'progress';
        break;
    }
    return steps;
  };

  const statusSteps = projectData ? getStatusSteps(projectData.status) : {};

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex justify-center items-center relative">
        <AnimatedBackground />
        <div className="text-center">
          <div className="inline-block p-8 bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20">
            <Loader className="w-16 h-16 animate-spin text-blue-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-800">Loading Project...</h2>
            <p className="text-gray-600 mt-2">Please wait while we fetch your project details</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex justify-center items-center relative">
        <AnimatedBackground />
        <div className="text-center p-8 max-w-md">
          <div className="inline-block p-8 bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20">
            <div className="p-4 bg-gradient-to-br from-red-500 to-orange-500 rounded-2xl text-white mx-auto mb-6 w-fit">
              <AlertTriangle className="w-12 h-12" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Oops! Something went wrong</h2>
            <p className="text-gray-600 leading-relaxed">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105 shadow-lg"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!projectData) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 relative">
      <AnimatedBackground />
      
      <div className="relative z-10 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Enhanced Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-6">
              <button
                onClick={() => navigate(-1)}
                className="p-3 bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <ArrowLeft className="w-5 h-5 text-gray-700" />
              </button>
              <div className="flex-1">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 bg-clip-text text-transparent mb-2">
                  {projectData.project_name}
                </h1>
                <p className="text-gray-600 text-lg">Project #{projectData.id}</p>
              </div>
            </div>
            
            <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4 lg:gap-6">
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-4 py-2 rounded-full font-semibold shadow-lg">
                  <Calendar size={16} />
                  <span>Due: {new Date(projectData.due_date).toLocaleDateString('en-US', { 
                    month: 'short', day: 'numeric', year: 'numeric' 
                  })}</span>
                </div>
                <div className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-2 rounded-full font-semibold shadow-lg">
                  <Activity size={16} />
                  <span>{projectData.status}</span>
                </div>
              </div>
              
              <div className="flex gap-3">
                <button 
                  onClick={() => navigate(`/kanban/${projectData.id}`)} 
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                >
                  <LayoutGrid size={16} />
                  <span>Kanban Board</span>
                </button>
                <button 
                  onClick={() => navigate(`/work-diary/${projectData.id}`)} 
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                >
                  <BookText size={16} />
                  <span>Work Diary</span>
                </button>
              </div>
            </div>
          </div>

          <OrderRequirements htmlContent={projectData.project_description} />

          {/* Main content area with enhanced layout */}
          <div className="flex flex-col gap-8">
            {/* Section 1: Enhanced Grid for Tasks and Sidebar */}
            {/* --- FIX: Removed 'items-start' to allow columns to have equal height. By default, grid items will stretch. --- */}
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
              
              {/* Left Column: Tasks List */}
              <div className="xl:col-span-3">
                <ProjectTasksList tasks={projectData.tasks} apiBaseUrl={API_BASE_URL} />
              </div>

              {/* Right Column: Enhanced Sidebar */}
              <div className="xl:col-span-1 flex flex-col gap-6">
                {/* Enhanced Timer Card */}
                <div className="backdrop-blur-xl bg-white/70 rounded-2xl shadow-2xl border border-white/20 p-6 hover:shadow-3xl transition-all duration-500">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="p-2 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl text-white">
                      <Clock className="w-6 h-6" />
                    </div>
                    <h2 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                      Time Remaining
                    </h2>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Days', value: timeLeft.days || 0, color: 'from-blue-500 to-purple-500' },
                      { label: 'Hours', value: timeLeft.hours || 0, color: 'from-emerald-500 to-teal-500' },
                      { label: 'Minutes', value: timeLeft.minutes || 0, color: 'from-amber-500 to-orange-500' },
                      { label: 'Seconds', value: timeLeft.seconds || 0, color: 'from-pink-500 to-rose-500' }
                    ].map((time) => (
                      <div key={time.label} className="text-center">
                        <div className={`bg-gradient-to-br ${time.color} rounded-xl py-3 px-2 shadow-lg`}>
                          <div className="text-2xl font-bold text-white">
                            {String(time.value).padStart(2, '0')}
                          </div>
                        </div>
                        <div className="text-xs text-gray-600 mt-2 font-medium">{time.label}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Enhanced Project Status Card */}
                <div className="backdrop-blur-xl bg-white/70 rounded-2xl shadow-2xl border border-white/20 flex-1 hover:shadow-3xl transition-all duration-500">
                  <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
  <h2 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
    Project Progress
  </h2>
  <div className="flex items-center gap-1">
    <TrendingUp className="w-5 h-5 text-blue-600" />
    <span className="w-fit min-w-[100px] text-center whitespace-nowrap bg-gradient-to-r from-blue-500 to-purple-500 text-white px-1 py-1 rounded-full text-sm font-bold">
      {projectData.status}
    </span>
  </div>
</div>

                    <div className="space-y-6">
                      <OrderStatusStep status={statusSteps.placed} text="Project Created" />
                      <OrderStatusStep status={statusSteps.requirements} text="Requirements Reviewed" />
                    <OrderStatusStep status={statusSteps.working} text="Work in Progress" />
                      <OrderStatusStep status={statusSteps.delivery} text="Project Delivered" isLast={true} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Enhanced Chat Interface */}
            <div className="grid grid-cols-1 gap-8">
              <div className="h-[600px]">
                <ConversationBox
                  messages={messages}
                  newMessage={newMessage}
                  setNewMessage={setNewMessage}
                  onSendMessage={handleSendMessage}
                />
              </div>
            </div>

           
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsPage;
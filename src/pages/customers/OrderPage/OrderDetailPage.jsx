import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Cookies from 'js-cookie';
import {
  Clock, MessageCircle, CheckCircle, Paperclip, Send, ClipboardList,
  ChevronDown, ChevronUp, Calendar, LayoutGrid, BookText, AlertTriangle,
  Loader, ListTodo, Star, Briefcase
} from "lucide-react";

// Helper to remove HTML tags for truncation
const stripHtml = (html) => {
  if (!html) return "";
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.textContent || "";
};

// Component for collapsible requirements
const OrderRequirements = ({ htmlContent }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const textContent = stripHtml(htmlContent);
  const maxLength = 200;
  const isTruncatable = textContent.length > maxLength;

  if (!htmlContent) return null;

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 mb-8">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-3">
          <ClipboardList className="w-6 h-6 text-gray-700" />
          Project Description
        </h2>
      </div>
      <div
        className={`prose max-w-none text-gray-700 transition-all duration-500 ease-in-out overflow-hidden ${isExpanded ? 'max-h-[1000px]' : 'max-h-24'}`}
        dangerouslySetInnerHTML={{ __html: isTruncatable && !isExpanded ? `${htmlContent.slice(0, 250)}...` : htmlContent }}
      />
      {isTruncatable && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-blue-600 hover:text-blue-800 font-semibold mt-3 text-sm flex items-center gap-1"
        >
          {isExpanded ? "Read Less" : "Read More"}
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      )}
    </div>
  );
};

// OrderStatusStep component
const OrderStatusStep = ({ status, text, isLast = false }) => {
    const statusConfig = {
      done: { Icon: <CheckCircle className="w-6 h-6 text-green-500 bg-white" />, textClass: "text-gray-800" },
      progress: { Icon: <Clock className="w-6 h-6 text-blue-500 bg-white" />, textClass: "text-blue-600 font-semibold" },
      pending: { Icon: <div className="w-6 h-6 flex items-center justify-center bg-white"><div className="w-3 h-3 rounded-full bg-gray-300"></div></div>, textClass: "text-gray-500" },
    };
    const { Icon, textClass } = statusConfig[status];

    return (
      <div className="flex items-start">
        <div className="flex flex-col items-center mr-4">
          {Icon}
          {!isLast && (<div className="mt-2 h-full w-px border-l-2 border-dashed border-gray-300"></div>)}
        </div>
        <span className={`pt-0.5 ${textClass}`}>{text}</span>
      </div>
    );
};

// ProjectTasksList component
const ProjectTasksList = ({ tasks, apiBaseUrl }) => {
  if (!tasks || tasks.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 text-center">
        <Briefcase className="w-10 h-10 text-gray-400 mx-auto mb-3" />
        <h3 className="text-xl font-semibold text-gray-800">No Tasks Assigned</h3>
        <p className="text-gray-500 mt-1">There are currently no tasks for this project.</p>
      </div>
    );
  }
  const getStatusBadge = (status) => {
    switch (status) {
      case 'Completed': return 'bg-green-100 text-green-800';
      case 'In Progress': return 'bg-blue-100 text-blue-800';
      case 'Todo': return 'bg-gray-100 text-gray-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };
  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 h-full flex flex-col">
      <div className="p-4 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center space-x-3">
          <ListTodo className="w-6 h-6 text-gray-700" />
          <h3 className="text-xl font-semibold text-gray-900">Project Tasks</h3>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {tasks.map(task => (
          <div key={task.id} className="p-4 border rounded-lg hover:shadow-sm transition-shadow duration-200">
            <div className="flex justify-between items-start">
              <h4 className="font-semibold text-gray-800 mb-2">{task.task_title}</h4>
              <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusBadge(task.task_status)}`}>{task.task_status}</span>
            </div>
            <div className="flex items-center justify-between text-sm text-gray-500 mt-2">
              <div className="flex items-center gap-4">
                 <div className="flex items-center gap-1.5" title={`${task.attachments.length} attachments`}><Paperclip size={14} /><span>{task.attachments.length}</span></div>
                 <div className="flex items-center gap-1.5" title={`Priority: ${task.priority}`}><Star size={14} className={task.priority === "Urgent" || task.priority === "High" ? "text-red-500" : "text-yellow-500"} /><span>{task.priority}</span></div>
              </div>
              <div className="flex items-center -space-x-2" title={`Assigned to: ${task.assignees.map(a => a.user.name).join(', ')}`}>
                 {task.assignees.map(assignee => (assignee.user.profile_pic ? (<img key={assignee.id} src={`${apiBaseUrl}/storage/${assignee.user.profile_pic}`} alt={assignee.user.name} className="w-7 h-7 rounded-full border-2 border-white"/>) : (<div key={assignee.id} className="w-7 h-7 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">{assignee.user.name.charAt(0)}</div>)))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ConversationBox component
const ConversationBox = ({ messages, newMessage, setNewMessage, onSendMessage }) => {
  const otherUserName = "Admin";
  const otherUserAvatar = "/api/placeholder/32/32";
  const currentUserAvatar = "/api/placeholder/32/32";

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 h-full flex flex-col">
      <div className="p-4 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center space-x-3">
          <MessageCircle className="w-6 h-6 text-gray-700" />
          <h3 className="text-xl font-semibold text-gray-900">Conversation with {otherUserName}</h3>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-6 space-y-6 h-96">
        {messages.map((message) => (
          <div key={message.id} className={`flex items-end gap-3 ${message.sender === 'buyer' ? 'flex-row-reverse' : ''}`}>
            <img src={message.sender === 'buyer' ? currentUserAvatar : otherUserAvatar} alt="avatar" className="w-8 h-8 rounded-full" />
            <div className={`max-w-md px-4 py-3 rounded-xl ${message.sender === 'buyer' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-gray-100 text-gray-800 rounded-bl-none'}`}>
              <p className="text-sm">{message.content}</p>
              <p className={`text-xs mt-2 text-right ${message.sender === 'buyer' ? 'text-blue-200' : 'text-gray-500'}`}>{message.time}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-lg flex-shrink-0">
        <div className="relative">
          <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Type your message here..." className="w-full border border-gray-300 rounded-lg pl-12 pr-28 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500" onKeyPress={(e) => e.key === 'Enter' && onSendMessage()} />
          <div className="absolute left-3 top-1/2 -translate-y-1/2"><Paperclip className="w-5 h-5 text-gray-400" /></div>
          <button onClick={onSendMessage} className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2">Send <Send className="w-4 h-4" /></button>
        </div>
      </div>
    </div>
  );
};


// Helper function for timer
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

// ==========================================================
// THE MAIN COMPONENT
// ==========================================================
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
      const message = { id: messages.length + 1, sender: "buyer", content: newMessage, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) };
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

  if (isLoading) { return (<div className="flex justify-center items-center min-h-screen"><Loader className="w-12 h-12 animate-spin text-blue-600" /></div>); }
  if (error) { return (<div className="flex flex-col justify-center items-center min-h-screen text-center p-4"><AlertTriangle className="w-12 h-12 text-red-500 mb-4" /><h2 className="text-2xl font-semibold text-gray-800 mb-2">Could Not Load Project</h2><p className="text-gray-600 max-w-md">{error}</p></div>); }
  if (!projectData) return null;


  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">{projectData.project_name}</h1>
            <p className="text-gray-500">Project #{projectData.id}</p>
          </div>
          <div className="flex flex-col sm:flex-row-reverse items-start sm:items-center gap-3">
             <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 text-sm font-semibold px-4 py-2 rounded-full">
                <Calendar size={16} />
                <span>Due on: {new Date(projectData.due_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
             </div>
             <div className="flex items-center gap-3">
                <button onClick={() => navigate(`/kanban/${projectData.id}`)} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-gradient-to-br from-purple-600 to-blue-500 rounded-lg shadow-md hover:shadow-lg hover:-translate-y-0.5 transform transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"><LayoutGrid size={16} /><span>Kanban</span></button>
                <button onClick={() => navigate(`/work-diary/${projectData.id}`)} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-gradient-to-br from-teal-500 to-cyan-500 rounded-lg shadow-md hover:shadow-lg hover:-translate-y-0.5 transform transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"><BookText size={16} /><span>Work Diary</span></button>
             </div>
          </div>
        </div>

        <OrderRequirements htmlContent={projectData.project_description} />

        {/* Main content area with updated layout */}
        <div className="flex flex-col gap-8">

          {/* Section 1: Grid for Tasks and Sidebar */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Column: Tasks List */}
            <div className="lg:col-span-2">
              <ProjectTasksList tasks={projectData.tasks} apiBaseUrl={API_BASE_URL} />
            </div>

            {/* Right Column: Sidebar with Timer and Status */}
            <div className="lg:col-span-1 flex flex-col gap-8">
              {/* Timer Card */}
              <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 flex-shrink-0">
                <div className="flex items-center space-x-3 mb-4">
                  <Clock className="w-6 h-6 text-gray-700" />
                  <h2 className="text-xl font-semibold text-gray-900">Delivery Time</h2>
                </div>
                <div className="flex justify-around text-center">
                  {[{ label: 'Days', value: timeLeft.days || 0 }, { label: 'Hours', value: timeLeft.hours || 0 }, { label: 'Minutes', value: timeLeft.minutes || 0 }, { label: 'Seconds', value: timeLeft.seconds || 0 }].map(time => (
                    <div key={time.label}>
                      <div className="bg-gray-100 rounded-md py-2 px-3"><div className="text-3xl font-bold text-gray-800">{String(time.value).padStart(2, '0')}</div></div>
                      <div className="text-xs text-gray-500 mt-2">{time.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Project Status Card */}
              <div className="bg-white rounded-lg shadow-md border border-gray-200 flex-1 flex flex-col">
                <div className="p-6 pb-0 flex-shrink-0">
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-gray-900">Project Status</h2>
                    <span className={`bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium`}>{projectData.status}</span>
                  </div>
                </div>
                <div className="flex-1 flex flex-col justify-around px-6 py-4">
                    <OrderStatusStep status={statusSteps.placed} text="Project created" />
                    <OrderStatusStep status={statusSteps.requirements} text="Requirements submitted" />
                    <OrderStatusStep status={statusSteps.working} text="Work in progress" />
                    <OrderStatusStep status={statusSteps.delivery} text="Project Delivered" isLast={true} />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Full-width Conversation Box */}
          <div>
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
  );
};

export default OrderDetailsPage;
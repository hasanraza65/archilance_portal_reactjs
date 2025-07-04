import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import {
  Clock,
  MessageCircle,
  CheckCircle,
  Paperclip,
  Send,
  ClipboardList,
  ChevronDown,
  ChevronUp,
  Calendar,
  LayoutGrid, // Icon for Kanban
  BookText    // Icon for Work Diary
} from "lucide-react";

// Component for collapsible requirements (No changes)
const OrderRequirements = ({ text }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const maxLength = 150;
  const isTruncatable = text.length > maxLength;

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 mb-8">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-3">
          <ClipboardList className="w-6 h-6 text-gray-700" />
          Your Requirements
        </h2>
      </div>
      <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isExpanded ? 'max-h-[1000px]' : 'max-h-[50px] sm:max-h-[25px]'}`}>
        <p className="text-gray-700 whitespace-pre-wrap">{isTruncatable && !isExpanded ? `${text.slice(0, maxLength)}...` : text}</p>
      </div>
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

// Refined helper component for Order Status steps (No changes)
const OrderStatusStep = ({ status, text, isLast = false }) => {
    const statusConfig = {
      done: {
        Icon: <CheckCircle className="w-6 h-6 text-green-500 bg-white" />,
        textClass: "text-gray-800",
      },
      progress: {
        Icon: <Clock className="w-6 h-6 text-blue-500 bg-white" />,
        textClass: "text-blue-600 font-semibold",
      },
      pending: {
        Icon: <div className="w-6 h-6 flex items-center justify-center bg-white"><div className="w-3 h-3 rounded-full bg-gray-300"></div></div>,
        textClass: "text-gray-500",
      },
    };
  
    const { Icon, textClass } = statusConfig[status];
  
    return (
      <div className="flex items-start">
        <div className="flex flex-col items-center mr-4">
          {Icon}
          {!isLast && (
            <div className="mt-2 h-full w-px border-l-2 border-dashed border-gray-300"></div>
          )}
        </div>
        <span className={`pt-0.5 ${textClass}`}>{text}</span>
      </div>
    );
  };


const OrderDetailsPage = () => {
  const navigate = useNavigate(); // Initialize the navigate hook

  const [timeLeft, setTimeLeft] = useState({ days: 2, hours: 14, minutes: 30, seconds: 45 });
  const [messages, setMessages] = useState([
    { id: 1, sender: "seller", content: "Hello! I've started working on your project. I'll deliver it within the promised timeframe.", time: "2:30 PM", avatar: "/api/placeholder/32/32" },
    { id: 2, sender: "buyer", content: "Great! Looking forward to seeing the progress. Please keep me updated.", time: "3:15 PM", avatar: "/api/placeholder/32/32" },
    { id: 3, sender: "seller", content: "Sure! I'll send you a preview by tomorrow. Do you have any specific requirements for the color scheme?", time: "3:45 PM", avatar: "/api/placeholder/32/32" },
  ]);
  const [newMessage, setNewMessage] = useState("");
  const orderRequirementsText = "Modern, responsive design with a dark theme. The site must be built using React and Tailwind CSS. Key sections required are: Home, About Us, Services, Portfolio, and a Contact page with a functional form. Please ensure the portfolio section has a filterable gallery. All assets (images, logos) will be provided in a shared Google Drive folder. The primary color should be a deep blue (#1E3A8A) and the accent color should be a vibrant teal (#14B8A6).";

  // For now, let's assume the project ID is 1. In a real app, you'd get this from the order data.
  const projectId = 1; 

  // Timer countdown effect
  useEffect(() => {
    if (timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.minutes === 0 && timeLeft.seconds === 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        let { days, hours, minutes, seconds } = prev;
        if (seconds > 0) seconds--;
        else { seconds = 59; if (minutes > 0) minutes--;
          else { minutes = 59; if (hours > 0) hours--;
            else { hours = 23; if (days > 0) days--; }
          }
        }
        return { days, hours, minutes, seconds };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      const message = { id: messages.length + 1, sender: "buyer", content: newMessage, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), avatar: "/api/placeholder/32/32" };
      setMessages([...messages, message]);
      setNewMessage("");
    }
  };

  // --- Navigation Handlers ---
  const handleWorkDiaryClick = () => {
    navigate(`/work-diary/${projectId}`);
  };

  const handleKanbanClick = () => {
    navigate(`/kanban/${projectId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header with Due Date Badge and Action Buttons */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">Order Details</h1>
            <p className="text-gray-500">Order #FO12345678</p>
          </div>
          <div className="flex flex-col sm:flex-row-reverse items-start sm:items-center gap-3">
             {/* Due Date Badge */}
             <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 text-sm font-semibold px-4 py-2 rounded-full">
                <Calendar size={16} />
                <span>Due on: March 15, 2024</span>
             </div>
             {/* Action Buttons */}
             <div className="flex items-center gap-3">
                <button 
                  onClick={handleKanbanClick}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-gradient-to-br from-purple-600 to-blue-500 rounded-lg shadow-md hover:shadow-lg hover:-translate-y-0.5 transform transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                >
                    <LayoutGrid size={16} />
                    <span>Kanban</span>
                </button>
                <button 
                  onClick={handleWorkDiaryClick}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-gradient-to-br from-teal-500 to-cyan-500 rounded-lg shadow-md hover:shadow-lg hover:-translate-y-0.5 transform transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
                >
                    <BookText size={16} />
                    <span>Work Diary</span>
                </button>
             </div>
          </div>
        </div>
        
        {/* Requirements Section */}
        <OrderRequirements text={orderRequirementsText} />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content Area */}
          <div className="lg:col-span-2">
             {/* Conversation Box */}
             <div className="bg-white rounded-lg shadow-md border border-gray-200 h-full flex flex-col">
              <div className="p-4 border-b border-gray-200 flex-shrink-0">
                <div className="flex items-center space-x-3">
                  <MessageCircle className="w-6 h-6 text-gray-700" />
                  <h3 className="text-xl font-semibold text-gray-900">Conversation with John Designer</h3>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {messages.map((message) => (
                  <div key={message.id} className={`flex items-end gap-3 ${message.sender === 'buyer' ? 'flex-row-reverse' : ''}`}>
                    <img src={message.avatar} alt="avatar" className="w-8 h-8 rounded-full" />
                    <div className={`max-w-md px-4 py-3 rounded-xl ${message.sender === 'buyer' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-gray-100 text-gray-800 rounded-bl-none'}`}>
                      <p className="text-sm">{message.content}</p>
                      <p className={`text-xs mt-2 text-right ${message.sender === 'buyer' ? 'text-blue-200' : 'text-gray-500'}`}>{message.time}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-lg flex-shrink-0">
                <div className="relative">
                  <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Type your message here..." className="w-full border border-gray-300 rounded-lg pl-12 pr-28 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500" onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()} />
                  <div className="absolute left-3 top-1/2 -translate-y-1/2"><Paperclip className="w-5 h-5 text-gray-400" /></div>
                  <button onClick={handleSendMessage} className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2">Send <Send className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Area */}
          <div className="lg:col-span-1 flex flex-col gap-8">
            {/* Timer Card */}
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 flex-shrink-0">
              <div className="flex items-center space-x-3 mb-4">
                <Clock className="w-6 h-6 text-gray-700" />
                <h2 className="text-xl font-semibold text-gray-900">Delivery Time</h2>
              </div>
              <div className="flex justify-around text-center">
                 {[
                  { label: 'Days', value: timeLeft.days },
                  { label: 'Hours', value: timeLeft.hours },
                  { label: 'Minutes', value: timeLeft.minutes },
                  { label: 'Seconds', value: timeLeft.seconds },
                ].map(time => (
                  <div key={time.label}>
                    <div className="bg-gray-100 rounded-md py-2 px-3">
                      <div className="text-3xl font-bold text-gray-800">{String(time.value).padStart(2, '0')}</div>
                    </div>
                    <div className="text-xs text-gray-500 mt-2">{time.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Status Card */}
            <div className="bg-white rounded-lg shadow-md border border-gray-200 flex-1 flex flex-col">
              <div className="p-6 pb-0 flex-shrink-0">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-900">Order Status</h2>
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">In Progress</span>
                </div>
              </div>
              <div className="flex-1 flex flex-col justify-around px-6">
                  <OrderStatusStep status="done" text="Order placed" />
                  <OrderStatusStep status="done" text="Requirements submitted" />
                  <OrderStatusStep status="progress" text="Seller started working" />
                  <OrderStatusStep status="pending" text="Awaiting Delivery" isLast={true} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsPage;
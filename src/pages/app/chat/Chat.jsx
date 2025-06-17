// src/pages/app/chat/Chat.jsx
import React, { useEffect, useRef, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import useWidth from "@/hooks/useWidth";
import Icon from "@/components/ui/Icon";
import UserAvatar from "./UserAvatar";
import { 
  toggleMobileChatSidebar, 
  infoToggle, 
  sendMessageToServer, 
  deleteMessage, 
  updateMessage, 
  addLiveMessage,
  liveDeleteMessage,
  liveUpdateMessage
} from "./store";
import Swal from "sweetalert2";
import { io } from "socket.io-client";

const SOCKET_URL = "http://13.60.76.68:3000";

const Chat = () => {
  const { user, messFeed, openinfo, isMessagesLoading, messagesError } = useSelector((state) => state.appchat);
  const loggedInUser = useSelector((state) => state.auth.user);
  const { width, breakpoints } = useWidth();
  const dispatch = useDispatch();
  const chatheight = useRef(null);
  const [message, setMessage] = useState("");
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editedText, setEditedText] = useState("");
  const socket = useRef(null);
  const [connectionStatus, setConnectionStatus] = useState("connecting");

  useEffect(() => {
    if (!user.id || !loggedInUser.id) {
      setConnectionStatus("disconnected");
      return;
    }

    if (socket.current) {
        socket.current.disconnect();
    }
    
    setConnectionStatus("connecting");
    socket.current = io(SOCKET_URL);

    const handleConnect = () => {
        setConnectionStatus("connected");
        console.log(`%c[SOCKET] CONNECTED! User: ${loggedInUser.name} (ID: ${loggedInUser.id}).`, 'color: green; font-weight: bold;');
    };

    // --- SMART LISTENER: Yahan par saari filtering hogi ---
    const handleChatMessage = (data) => {
        console.log('%c[SOCKET] Received a "chat-message" from server:', 'color: blue;', data);
        // Step 1: Check if the message is for me OR from me (in case server broadcasts back to sender)
        if (data.receiver_id == loggedInUser.id && data.sender_id == user.id) {
          console.log(`%c[SOCKET] Message is for me from ${user.fullName}. Processing...`, 'color: #008000;');
          const formattedMessage = {
              id: data.id || `socket-${Date.now()}`,
              content: data.message,
              sender: 'them',
              time: new Date(data.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              img: data.sender_avatar ? `${import.meta.env.VITE_BACKEND_BASE_URL}/storage/${data.sender_avatar}` : null,
              senderFullName: data.sender_name,
          };
          dispatch(addLiveMessage({ formatted: formattedMessage, ...data }));
        } else {
            console.warn(`[SOCKET] Ignoring message. It's not for me. (From: ${data.sender_id}, To: ${data.receiver_id})`);
        }
    };
    
    const handleMessageDeleted = (data) => {
        console.log('%c[SOCKET] Received a "message-deleted" event:', 'color: red;', data);
        // Check if the delete event is for me
        if (data.receiverId == loggedInUser.id) {
            console.log(`%c[SOCKET] Processing delete event for my chat.`, 'color: #FF6347;');
            dispatch(liveDeleteMessage({ messageId: data.messageId }));
        } else {
            console.warn(`[SOCKET] Ignoring delete event. It's for another chat.`);
        }
    };

    const handleMessageUpdated = (data) => {
        console.log('%c[SOCKET] Received a "message-updated" event:', 'color: orange;', data);
         // Check if the update event is for me
        if (data.receiverId == loggedInUser.id) {
            console.log(`%c[SOCKET] Processing update event for my chat.`, 'color: #FFA500;');
            dispatch(liveUpdateMessage({ messageId: data.messageId, newContent: data.content }));
        } else {
            console.warn(`[SOCKET] Ignoring update event. It's for another chat.`);
        }
    };

    const handleDisconnect = () => {
        setConnectionStatus("disconnected");
        console.warn("[SOCKET] DISCONNECTED from server.");
    };

    socket.current.on("connect", handleConnect);
    socket.current.on("chat-message", handleChatMessage);
    socket.current.on("message-deleted", handleMessageDeleted);
    socket.current.on("message-updated", handleMessageUpdated);
    socket.current.on("disconnect", handleDisconnect);

    return () => {
        socket.current.off("connect", handleConnect);
        socket.current.off("chat-message", handleChatMessage);
        socket.current.off("message-deleted", handleMessageDeleted);
        socket.current.off("message-updated", handleMessageUpdated);
        socket.current.off("disconnect", handleDisconnect);
        socket.current.disconnect();
    };
  }, [user.id, loggedInUser.id, dispatch]);

  useEffect(() => { 
    if (chatheight.current) { 
      chatheight.current.scrollTop = chatheight.current.scrollHeight; 
    } 
  }, [messFeed]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (message.trim() && user?.id) {
      const optimisticPayload = { content: message.trim(), receiverId: user.id };
      
      dispatch(sendMessageToServer(optimisticPayload)).unwrap().then((result) => {
        if (socket.current && socket.current.connected && result.originalMessage) {
            console.log('%c[SOCKET] Emitting "chat-message" to ALL users:', 'color: purple; font-weight: bold;', result.originalMessage);
            socket.current.emit("chat-message", result.originalMessage);
        }
      }).catch((err) => console.error("Failed to send message and emit socket event:", err));
      
      setMessage("");
    }
  };

  const handleDeleteMessage = (messageId) => {
    Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
      if (result.isConfirmed) {
        dispatch(deleteMessage(messageId)).unwrap().then(() => {
          if (socket.current && socket.current.connected) {
            const payload = { messageId: messageId, receiverId: user.id };
            console.log('%c[SOCKET] Emitting "message-deleted" to ALL users:', 'color: red; font-weight: bold;', payload);
            socket.current.emit("message-deleted", payload);
          }
        }).catch(err => console.error("Failed to delete message and emit socket event:", err));
      }
    })
  };

  const handleUpdateSubmit = (e, messageId) => {
    e.preventDefault();
    if (editedText.trim()) {
      const newContent = editedText.trim();
      dispatch(updateMessage({ messageId, newContent })).unwrap().then(() => {
        if(socket.current && socket.current.connected) {
          const payload = { messageId, content: newContent, receiverId: user.id };
          console.log('%c[SOCKET] Emitting "message-updated" to ALL users:', 'color: orange; font-weight: bold;', payload);
          socket.current.emit("message-updated", payload);
        }
      }).catch(err => console.error("Failed to update message and emit socket event:", err));
      handleCancelEdit();
    }
  };

  // Rest of the component (JSX) remains the same as before
  const handleEditClick = (message) => { setEditingMessageId(message.id); setEditedText(message.content); };
  const handleCancelEdit = () => { setEditingMessageId(null); setEditedText(""); };
  return (
    <div className="h-full">
      <header className="border-b border-slate-100 dark:border-slate-700">
          <div className="flex py-6 md:px-6 px-3 items-center">
              <div className="flex-1">
                <div className="flex space-x-3 rtl:space-x-reverse">
                    {width <= breakpoints.lg && (<span onClick={() => dispatch(toggleMobileChatSidebar(true))} className="text-slate-900 dark:text-white cursor-pointer text-xl self-center ltr:mr-3 rtl:ml-3"><Icon icon="heroicons-outline:menu-alt-1" /></span>)}
                    <div className="flex-none"><div className="h-10 w-10 rounded-full relative"><span className={` status ring-1 ring-white inline-block h-[10px] w-[10px] rounded-full absolute -right-0 top-0 ${user.status === "active" ? "bg-success-500" : "bg-secondary-500"}`}></span><UserAvatar avatarUrl={user.avatar} fullName={user.fullName} /></div></div>
                    <div className="flex-1 text-start">
                        <span className="block text-slate-800 dark:text-slate-300 text-sm font-medium mb-[2px] truncate">{user.fullName}</span>
                        <div className="flex items-center space-x-1 rtl:space-x-reverse">
                            <span className={`h-2 w-2 rounded-full inline-block ${connectionStatus === 'connected' ? 'bg-success-500' : connectionStatus === 'connecting' ? 'bg-yellow-500' : 'bg-danger-500'}`}></span>
                            <span className="block text-slate-500 dark:text-slate-300 text-xs font-normal capitalize">{connectionStatus}</span>
                        </div>
                    </div>
                </div>
              </div>
              <div className="flex-none flex md:space-x-3 space-x-1 items-center rtl:space-x-reverse"><div className="msg-action-btn cursor-pointer"><Icon icon="heroicons-outline:phone" /></div><div className="msg-action-btn cursor-pointer"><Icon icon="heroicons-outline:video-camera" /></div><div onClick={() => dispatch(infoToggle(!openinfo))} className="msg-action-btn cursor-pointer"><Icon icon="heroicons-outline:dots-horizontal" /></div></div>
          </div>
      </header>
      <div className="chat-content parent-height">
        <div className="msgs overflow-y-auto msg-height pt-6 space-y-6" ref={chatheight}>
          {isMessagesLoading && (<div className="flex justify-center items-center h-full"><p className="text-slate-500">Loading messages...</p></div>)}
          {messagesError && (<div className="flex justify-center items-center h-full"><p className="text-red-500">Error: {messagesError}</p></div>)}
          {!isMessagesLoading && !messagesError && messFeed.map((item) => (<div className="block md:px-6 px-4" key={item.id}>
            <div className={`flex space-x-2 items-start group rtl:space-x-reverse ${item.sender === 'me' ? 'justify-end' : ''}`}>
              {item.sender === "them" && (<div className="flex-none"><UserAvatar avatarUrl={item.img} fullName={item.senderFullName} className="h-8 w-8" /></div>)}
              <div className="flex-1 flex space-x-4 rtl:space-x-reverse max-w-[70%]">
                <div className={`p-3 rounded-xl text-sm break-words w-full ${item.sender === 'me' ? 'bg-slate-900 text-white rounded-tr-none' : 'bg-slate-100 dark:bg-slate-600 dark:text-slate-300 text-slate-600 rounded-tl-none'}`}>
                  {editingMessageId === item.id ? (
                      <form onSubmit={(e) => handleUpdateSubmit(e, item.id)}>
                        <textarea
                          value={editedText}
                          onChange={(e) => setEditedText(e.target.value)}
                          className="w-full bg-transparent text-white focus:ring-0 focus:outline-none resize-none"
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              handleUpdateSubmit(e, item.id);
                            }
                            if (e.key === "Escape") {
                              handleCancelEdit();
                            }
                          }}
                          autoFocus
                        />
                        <div className="text-xs text-right mt-1 space-x-2">
                          <button type="button" onClick={handleCancelEdit} className="text-slate-400 hover:text-slate-200">Cancel</button>
                          <button type="submit" className="text-blue-500 hover:text-blue-400 font-semibold">Save</button>
                        </div>
                      </form>
                    ) : (
                      <>
                        {item.content}
                        <div className={`text-xs mt-1 ${item.sender === 'me' ? 'text-slate-300' : 'text-slate-400'}`}>{item.time}</div>
                      </>
                    )}
                </div>
              </div>
              {item.sender === "me" && !editingMessageId && (
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center space-x-2 self-center">
                    <div onClick={() => handleEditClick(item)} className="cursor-pointer">
                      <Icon icon="heroicons-outline:pencil" className="text-slate-400 hover:text-blue-500" />
                    </div>
                    <div onClick={() => handleDeleteMessage(item.id)} className="cursor-pointer">
                      <Icon icon="heroicons-outline:trash" className="text-slate-400 hover:text-danger-500" />
                    </div>
                  </div>
              )}
              {item.sender === "me" && (<div className="flex-none"><UserAvatar avatarUrl={loggedInUser?.profile_pic} fullName={loggedInUser?.name} className="h-8 w-8" /></div>)}
              </div>
            </div>))}
        </div>
      </div>
      <footer className="md:px-6 px-4 sm:flex md:space-x-4 sm:space-x-2 rtl:space-x-reverse border-t md:pt-6 pt-4 border-slate-100 dark:border-slate-700">
        <form onSubmit={handleSendMessage} className="flex-1 flex items-center space-x-3"><div className="flex-1"><textarea value={message} onChange={(e) => setMessage(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { handleSendMessage(e); } }} placeholder="Type your message..." className="focus:ring-0 focus:outline-0 block w-full bg-transparent dark:text-white resize-none" /></div><div className="flex-none md:pr-0 pr-3"><button type="submit" className="h-8 w-8 bg-slate-900 text-white flex flex-col justify-center items-center text-lg rounded-full"><Icon icon="heroicons-outline:paper-airplane" className="transform rotate-[60deg]" /></button></div></form>
      </footer>
    </div>
  );
};

export default Chat;
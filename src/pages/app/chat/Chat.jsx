// src/pages/app/chat/Chat.jsx
import React, { useEffect, useRef, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import useWidth from "@/hooks/useWidth";
import Icon from "@/components/ui/Icon";
import UserAvatar from "@/components/ui/UserAvatar";
import {
  toggleMobileChatSidebar,
  infoToggle,
  sendMessageToServer,
  deleteMessage,
  updateMessage,
  addReaction,
} from "./store";
import Swal from "sweetalert2";
import { getSocket } from "@/socket";
import MessageContextMenu from "./MessageContextMenu";
import { toast } from "react-toastify";
import { current } from "@reduxjs/toolkit";

const Chat = () => {
  const { user, messFeed, openinfo, isMessagesLoading, messagesError } =
    useSelector((state) => state.appchat);
  const loggedInUser = useSelector((state) => state.auth.user);
  const { width, breakpoints } = useWidth();
  const dispatch = useDispatch();
  const chatheight = useRef(null);
  const [message, setMessage] = useState("");
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editedText, setEditedText] = useState("");

  const [menuState, setMenuState] = useState({
    visible: false,
    position: { x: 0, y: 0 },
    message: null,
  });

  useEffect(() => {
    if (chatheight.current) {
      chatheight.current.scrollTop = chatheight.current.scrollHeight;
    }
  }, [messFeed]);

  const handleRightClick = (event, message) => {
    event.preventDefault();
    event.stopPropagation();
    setMenuState({
      visible: true,
      position: { x: event.clientX, y: event.clientY },
      message: message,
    });
  };

  const handleCloseMenu = () => {
    if (menuState.visible) {
      setMenuState({ ...menuState, visible: false });
    }
  };

  const handleMenuAction = (action, data) => {
    const currentMessage = menuState.message;
    switch (action) {
      case 'copy':
        navigator.clipboard.writeText(currentMessage.content);
        toast.success("Message copied to clipboard!");
        break;
      case 'delete-for-me':
        handleDeleteMessage(currentMessage.id);
        break;
      case 'react':
        dispatch(addReaction({ messageId: currentMessage.id, emoji: data }))
          .unwrap()
          .then((result) => {
            const socket = getSocket();
            const reactionData = result.reaction || result.data || result;
            if (socket?.connected && reactionData) {
              socket.emit('message-reacted', {
                messageId: currentMessage.id,
                reaction: reactionData,
                receiverId: user.id,
              });
                   
            }
             console.log('string ', reactionData);
          })
          .catch((err) => {
            console.error("Failed to add reaction or emit socket event:", err);
          });
        break;
      case 'reply':
        console.log("Reply action clicked for:", currentMessage);
        break;
      default:
        console.log(`Action: ${action}`, currentMessage);
    }
    handleCloseMenu();
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (message.trim() && user?.id) {
      dispatch(sendMessageToServer({ content: message.trim(), receiverId: user.id }))
        .unwrap()
        .then((result) => {
          const socket = getSocket();
          if (socket?.connected && result.originalMessage) {
            socket.emit("chat-message", result.originalMessage);
          }
        });
      setMessage("");
    }
  };

  const handleDeleteMessage = (messageId) => {
    Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    }).then((result) => {
      if (result.isConfirmed) {
        dispatch(deleteMessage(messageId))
          .unwrap()
          .then(() => {
            const socket = getSocket();
            if (socket?.connected) {
              socket.emit("message-deleted", {
                messageId,
                receiverId: user.id,
              });
            }
          });
      }
    });
  };

  const handleUpdateSubmit = (e, messageId) => {
    e.preventDefault();
    if (editedText.trim()) {
      const newContent = editedText.trim();
      dispatch(updateMessage({ messageId, newContent }))
        .unwrap()
        .then(() => {
          const socket = getSocket();
          if (socket?.connected) {
            socket.emit("message-updated", {
              messageId,
              content: newContent,
              receiverId: user.id,
            });
          }
        });
      handleCancelEdit();
    }
  };

  const handleEditClick = (message) => {
    setEditingMessageId(message.id);
    setEditedText(message.content);
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditedText("");
  };

  return (
    <div className="h-full" onClick={handleCloseMenu}>
      <header className="border-b border-slate-100 dark:border-slate-700">
        <div className="flex py-6 md:px-6 px-3 items-center">
          <div className="flex-1">
            <div className="flex space-x-3 rtl:space-x-reverse">
              {width <= breakpoints.lg && (
                <span onClick={() => dispatch(toggleMobileChatSidebar(true))} className="text-slate-900 dark:text-white cursor-pointer text-xl self-center ltr:mr-3 rtl:ml-3">
                  <Icon icon="heroicons-outline:menu-alt-1" />
                </span>
              )}
              <div className="flex-none">
                <div className="h-10 w-10 rounded-full relative">
                  <span className={`status ring-1 ring-white inline-block h-[10px] w-[10px] rounded-full absolute -right-0 top-0 ${user.status === "active" ? "bg-success-500" : "bg-secondary-500"}`}></span>
                  <UserAvatar avatarUrl={user.avatar} fullName={user.fullName} />
                </div>
              </div>
              <div className="flex-1 text-start">
                <span className="block text-slate-800 dark:text-slate-300 text-sm font-medium mb-[2px] truncate">{user.fullName}</span>
                <span className="block text-slate-500 dark:text-slate-300 text-xs font-normal capitalize">Active now</span>
              </div>
            </div>
          </div>
          <div className="flex-none flex md:space-x-3 space-x-1 items-center rtl:space-x-reverse">
            <div className="msg-action-btn cursor-pointer"><Icon icon="heroicons-outline:phone" /></div>
            <div className="msg-action-btn cursor-pointer"><Icon icon="heroicons-outline:video-camera" /></div>
            <div onClick={() => dispatch(infoToggle(!openinfo))} className="msg-action-btn cursor-pointer"><Icon icon="heroicons-outline:dots-horizontal" /></div>
          </div>
        </div>
      </header>
      <div className="chat-content parent-height">
        <div className="msgs overflow-y-auto msg-height pt-6 space-y-6" ref={chatheight}>
          {!isMessagesLoading && !messagesError && messFeed.map((item) => (
            <div className="block md:px-6 px-4" key={item.id} onContextMenu={(e) => handleRightClick(e, item)}>
              <div className={`flex space-x-2 items-start group rtl:space-x-reverse ${item.sender === "me" ? "justify-end" : ""}`}>
                {item.sender === "them" && (
                  <div className="flex-none self-end">
                    <UserAvatar avatarUrl={item.img} fullName={item.senderFullName} className="h-8 w-8" />
                  </div>
                )}
                <div className={`flex flex-col max-w-[70%] ${item.sender === 'me' ? 'items-end' : 'items-start'}`}>
                  <div className={`p-3 rounded-xl text-sm break-words w-full ${item.sender === "me" ? "bg-slate-900 text-white rounded-tr-none" : "bg-slate-100 dark:bg-slate-600 dark:text-slate-300 text-slate-600 rounded-tl-none"}`}>
                    {editingMessageId === item.id ? (
                      <form onSubmit={(e) => handleUpdateSubmit(e, item.id)}>
                        <textarea value={editedText} onChange={(e) => setEditedText(e.target.value)} className="w-full bg-transparent text-white focus:ring-0 focus:outline-none resize-none" onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { handleUpdateSubmit(e, item.id); } if (e.key === "Escape") { handleCancelEdit(); } }} autoFocus />
                        <div className="text-xs text-right mt-1 space-x-2">
                          <button type="button" onClick={handleCancelEdit} className="text-slate-400 hover:text-slate-200">Cancel</button>
                          <button type="submit" className="text-blue-500 hover:text-blue-400 font-semibold">Save</button>
                        </div>
                      </form>
                    ) : (
                      <>
                        {item.content}
                        <div className={`text-xs mt-1 ${item.sender === "me" ? "text-slate-300" : "text-slate-400"}`}>{item.time}</div>
                      </>
                    )}
                  </div>
                  {item.reactions && item.reactions.length > 0 && (
                    <div className="flex space-x-1 -mt-2 z-10">
                      {item.reactions.map((reaction, index) => (
                        <div key={index} className="bg-white dark:bg-slate-700 px-2 py-0.5 rounded-full text-xs shadow-md border border-slate-200 dark:border-slate-600">
                          {reaction.reaction}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {item.sender === "me" && !editingMessageId && (
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center space-x-2 self-center">
                    <div onClick={() => handleEditClick(item)} className="cursor-pointer"><Icon icon="heroicons-outline:pencil" className="text-slate-400 hover:text-blue-500" /></div>
                    <div onClick={() => handleDeleteMessage(item.id)} className="cursor-pointer"><Icon icon="heroicons-outline:trash" className="text-slate-400 hover:text-danger-500" /></div>
                  </div>
                )}
                {item.sender === "me" && (<div className="flex-none self-end"><UserAvatar avatarUrl={loggedInUser?.profile_pic} fullName={loggedInUser?.name} className="h-8 w-8" /></div>)}
              </div>
            </div>
          ))}
        </div>
      </div>
      <footer className="md:px-6 px-4 sm:flex md:space-x-4 sm:space-x-2 rtl:space-x-reverse border-t md:pt-6 pt-4 border-slate-100 dark:border-slate-700">
        <form onSubmit={handleSendMessage} className="flex-1 flex items-center space-x-3">
          <div className="flex-1">
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { handleSendMessage(e); } }} placeholder="Type your message..." className="focus:ring-0 focus:outline-0 block w-full bg-transparent dark:text-white resize-none" />
          </div>
          <div className="flex-none md:pr-0 pr-3">
            <button type="submit" className="h-8 w-8 bg-slate-900 text-white flex flex-col justify-center items-center text-lg rounded-full">
              <Icon icon="heroicons-outline:paper-airplane" className="transform rotate-[60deg]" />
            </button>
          </div>
        </form>
      </footer>
      <MessageContextMenu visible={menuState.visible} position={menuState.position} message={menuState.message} onClose={handleCloseMenu} onAction={handleMenuAction} />
    </div>
  );
};

export default Chat;
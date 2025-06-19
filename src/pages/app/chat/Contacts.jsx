// src/pages/app/chat/Contacts.jsx

import React from 'react';
import { useDispatch } from 'react-redux';
import UserAvatar from '@/components/ui/UserAvatar';
import { openChat, fetchConversation, markAsRead } from './store';

const Contacts = ({ contact }) => {
  const { fullName, avatar, status, lastmessage, unredmessage, lastMessageTime } = contact;
  const dispatch = useDispatch();

  const formatTime = (timeString) => {
    if (!timeString) return "";
    try { return new Date(timeString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }); } 
    catch (e) { return ""; }
  };

  const handleContactClick = () => {
    // Opens the chat and optimistically sets unread count to 0 in UI
    dispatch(openChat({ contact }));
    
    // Fetches the conversation history
    dispatch(fetchConversation(contact.id));

    // Calls the API to mark messages as read on the backend
    if (contact.unredmessage > 0) {
      dispatch(markAsRead(contact.id));
    }
  };

  return (
    <div className="block w-full py-5 focus:ring-0 outline-none cursor-pointer group transition-all duration-150 hover:bg-slate-100 dark:hover:bg-slate-600 dark:hover:bg-opacity-70" onClick={handleContactClick}>
      <div className="flex space-x-3 px-6 rtl:space-x-reverse">
        <div className="flex-none">
          <div className="h-10 w-10 rounded-full relative">
            <span className={`status ring-1 ring-white inline-block h-[10px] w-[10px] rounded-full absolute -right-0 top-0 ${status === "active" ? "bg-success-500" : "bg-secondary-500"}`}></span>
            <UserAvatar avatarUrl={avatar} fullName={fullName} />
          </div>
        </div>
        <div className="flex-1 text-start flex">
          <div className="flex-1">
            <span className="block text-slate-800 dark:text-slate-300 text-sm font-medium mb-[2px]">{fullName}</span>
            <span className="block text-slate-600 dark:text-slate-300 text-xs font-normal truncate">{lastmessage}</span>
          </div>
          <div className="flex-none ltr:text-right rtl:text-end">
            <span className="block text-xs text-slate-400 dark:text-slate-400 font-normal">{formatTime(lastMessageTime)}</span>
            {unredmessage > 0 && <span className="inline-flex flex-col items-center justify-center text-[10px] font-medium w-4 h-4 bg-[#FFC155] text-white rounded-full">{unredmessage}</span>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contacts;
import React, { useEffect, useRef, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import useWidth from "@/hooks/useWidth";
import Icon from "@/components/ui/Icon";
import UserAvatar from "./UserAvatar";
import { toggleMobileChatSidebar, infoToggle, sendMessage } from "./store";

const Chat = () => {
  const { user, messFeed, openinfo } = useSelector((state) => state.appchat);
  const { width, breakpoints } = useWidth();
  const dispatch = useDispatch();
  const chatheight = useRef(null);
  const [message, setMessage] = useState("");

  useEffect(() => { if (chatheight.current) { chatheight.current.scrollTop = chatheight.current.scrollHeight; } }, [messFeed]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (message.trim()) {
      dispatch(sendMessage({ content: message.trim(), sender: "me", time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }));
      setMessage("");
    }
  };

  return (
    <div className="h-full">
      <header className="border-b border-slate-100 dark:border-slate-700"><div className="flex py-6 md:px-6 px-3 items-center"><div className="flex-1"><div className="flex space-x-3 rtl:space-x-reverse">{width <= breakpoints.lg && (<span onClick={() => dispatch(toggleMobileChatSidebar(true))} className="text-slate-900 dark:text-white cursor-pointer text-xl self-center ltr:mr-3 rtl:ml-3"><Icon icon="heroicons-outline:menu-alt-1" /></span>)}<div className="flex-none"><div className="h-10 w-10 rounded-full relative"><span className={` status ring-1 ring-white inline-block h-[10px] w-[10px] rounded-full absolute -right-0 top-0 ${user.status === "active" ? "bg-success-500" : "bg-secondary-500"}`}></span><UserAvatar avatarUrl={user.avatar} fullName={user.fullName} /></div></div><div className="flex-1 text-start"><span className="block text-slate-800 dark:text-slate-300 text-sm font-medium mb-[2px] truncate">{user.fullName}</span><span className="block text-slate-500 dark:text-slate-300 text-xs font-normal">Active now</span></div></div></div><div className="flex-none flex md:space-x-3 space-x-1 items-center rtl:space-x-reverse"><div className="msg-action-btn cursor-pointer"><Icon icon="heroicons-outline:phone" /></div><div className="msg-action-btn cursor-pointer"><Icon icon="heroicons-outline:video-camera" /></div><div onClick={() => dispatch(infoToggle(!openinfo))} className="msg-action-btn cursor-pointer"><Icon icon="heroicons-outline:dots-horizontal" /></div></div></div></header>
      <div className="chat-content parent-height"><div className="msgs overflow-y-auto msg-height pt-6 space-y-6" ref={chatheight}>{messFeed.map((item, i) => (<div className="block md:px-6 px-4" key={i}>{item.sender === "them" && (<div className="flex space-x-2 items-start group rtl:space-x-reverse"><div className="flex-none"><UserAvatar avatarUrl={item.img || user.avatar} fullName={user.fullName} className="h-8 w-8" /></div><div className="flex-1 flex space-x-4 rtl:space-x-reverse"><div><div className="text-contrent p-3 bg-slate-100 dark:bg-slate-600 dark:text-slate-300 text-slate-600 text-sm font-normal mb-1 rounded-md flex-1 whitespace-pre-wrap break-all">{item.content}</div><span className="font-normal text-xs text-slate-400 dark:text-slate-400">{item.time}</span></div></div></div>)}{item.sender === "me" && (<div className="flex space-x-2 items-start justify-end group w-full rtl:space-x-reverse"><div className="whitespace-pre-wrap break-all"><div className="text-contrent p-3 bg-slate-300 dark:bg-slate-900 dark:text-slate-300 text-slate-800 text-sm font-normal rounded-md flex-1 mb-1">{item.content}</div><span className="font-normal text-xs text-slate-400">{item.time}</span></div><div className="flex-none"><UserAvatar avatarUrl={null} fullName="Me" className="h-8 w-8" /></div></div>)}</div>))}</div></div>
      <footer className="md:px-6 px-4 sm:flex md:space-x-4 sm:space-x-2 rtl:space-x-reverse border-t md:pt-6 pt-4 border-slate-100 dark:border-slate-700"><form onSubmit={handleSendMessage} className="flex-1 flex items-center space-x-3"><div className="flex-1"><textarea value={message} onChange={(e) => setMessage(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { handleSendMessage(e); } }} placeholder="Type your message..." className="focus:ring-0 focus:outline-0 block w-full bg-transparent dark:text-white resize-none" /></div><div className="flex-none md:pr-0 pr-3"><button type="submit" className="h-8 w-8 bg-slate-900 text-white flex flex-col justify-center items-center text-lg rounded-full"><Icon icon="heroicons-outline:paper-airplane" className="transform rotate-[60deg]" /></button></div></form></footer>
    </div>
  );
};

export default Chat;
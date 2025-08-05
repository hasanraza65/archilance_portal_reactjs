import React, { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import Icon from "@/components/ui/Icon";
import ScrollContainer from "react-indiana-drag-scroll"; // <-- IMPORT THE NEW LIBRARY

const EMOJI_REACTIONS = ["👍", "❤️", "😂", "😯", "😢", "🙏", "🔥", "😡"];

const MessageContextMenu = ({
  visible,
  position,
  message,
  onClose,
  onAction,
  loggedInUserId,
}) => {
  const menuRef = useRef(null);
  const [finalPosition, setFinalPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose();
      }
    };
    if (visible) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [visible, onClose]);

  useEffect(() => {
    if (visible && menuRef.current) {
      const menuWidth = menuRef.current.offsetWidth;
      const menuHeight = menuRef.current.offsetHeight;
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;

      let left = position.x;
      let top = position.y;

      if (left + menuWidth > windowWidth) {
        left = windowWidth - menuWidth - 10;
      }
      if (top + menuHeight > windowHeight) {
        top = windowHeight - menuHeight - 10;
      }
      if (top < 10) top = 10;
      if (left < 10) left = 10;

      setFinalPosition({ top, left });
    }
  }, [visible, position]);

  if (!visible || !message) return null;

  const myReaction = message.reactions?.find(r => r.user_id === loggedInUserId);

  const menuItems = [
    { 
      name: "Reply", 
      icon: "heroicons-outline:reply",
      action: "reply"
    },
    { 
      name: "Copy", 
      icon: "heroicons-outline:document-copy",
      action: "copy",
      condition: !!message.content
    },
    { 
      name: "Delete for me", 
      icon: "heroicons-outline:trash", 
      action: "delete-for-me",
      danger: true,
      condition: message.sender === 'me'
    },
  ];

  const menuContent = (
    <div
      ref={menuRef}
      className="fixed z-[9999] w-48 rounded-xl bg-white dark:bg-slate-800 shadow-2xl ring-1 ring-black ring-opacity-5 focus:outline-none border border-slate-200 dark:border-slate-700 overflow-hidden"
      style={{ top: `${finalPosition.top}px`, left: `${finalPosition.left}px` }}
    >
      <ul className="py-1">
        {menuItems.map((item) => (
          (typeof item.condition === 'undefined' || item.condition) && (
            <li
              key={item.name}
              className={`
                flex items-center px-4 py-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer
                ${
                  item.danger
                    ? "hover:bg-red-500/10 hover:text-red-500 dark:hover:bg-red-500/20 dark:hover:text-red-400"
                    : "hover:bg-slate-100 dark:hover:bg-slate-700"
                }
              `}
              onClick={() => onAction(item.action, message)}
            >
              <Icon icon={item.icon} className="w-5 h-5 mr-3" />
              <span>{item.name}</span>
            </li>
          )
        ))}
      </ul>
      {/* WRAP THE EMOJI BAR WITH ScrollContainer */}
       <ScrollContainer className="flex justify-around items-center p-2 bg-slate-50 dark:bg-slate-700/50 cursor-grab">
        {EMOJI_REACTIONS.map((emoji) => (
          <button
            key={emoji}
            className={`cursor-pointer text-xl p-1 rounded-full transition-transform hover:scale-125 flex-shrink-0 mx-1 ${
              myReaction?.reaction === emoji 
                ? 'bg-blue-200 dark:bg-blue-600'
                : 'hover:bg-slate-200 dark:hover:bg-slate-600'
            }`}
            onClick={() => onAction("react", emoji)}
          >
            {emoji}
          </button>
        ))}
      </ScrollContainer>
    </div>
  );

  return ReactDOM.createPortal(menuContent, document.body);
};

export default MessageContextMenu;
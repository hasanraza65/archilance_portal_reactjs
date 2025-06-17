// src/pages/app/chat/MessageContextMenu.jsx
import React, { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom"; // IMPORT ahem hai
import Icon from "@/components/ui/Icon";

const EMOJI_REACTIONS = ["👍", "❤️", "😂", "😯", "😢", "🙏"];

const MessageContextMenu = ({
  visible,
  position,
  message,
  onClose,
  onAction,
}) => {
  const menuRef = useRef(null);
  // NEW: State to hold the final, adjusted position of the menu
  const [finalPosition, setFinalPosition] = useState({ top: 0, left: 0 });

  // Bahar click karne par menu ko band karne ka logic
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

  // NEW: Yeh effect menu ki position ko adjust karega taake woh screen se bahar na jaye
  useEffect(() => {
    if (visible && menuRef.current) {
      const menuWidth = menuRef.current.offsetWidth;
      const menuHeight = menuRef.current.offsetHeight;
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;

      let left = position.x;
      let top = position.y;

      // Agar menu right edge se bahar ja raha ho
      if (left + menuWidth > windowWidth) {
        left = windowWidth - menuWidth - 10; // 10px ka margin
      }

      // Agar menu bottom edge se bahar ja raha ho
      if (top + menuHeight > windowHeight) {
        top = windowHeight - menuHeight - 10; // 10px ka margin
      }

      // Agar menu top ya left se bahar ja raha ho
      if (top < 0) top = 10;
      if (left < 0) left = 10;

      setFinalPosition({ top, left });
    }
  }, [visible, position]);

  if (!visible) return null;

  const menuItems = [
    { name: "Reply", icon: "heroicons-outline:reply" },
    { name: "Copy", icon: "heroicons-outline:duplicate" },
    { name: "Forward", icon: "heroicons-outline:arrow-right" },
    { name: "Pin", icon: "heroicons-outline:pin" },
    { name: "Delete for me", icon: "heroicons-outline:trash", danger: true },
  ];

  // Component ka JSX ab is variable mein hai
  const menuContent = (
    <div
      ref={menuRef}
      // UPDATED: 'fixed' position use karein aur z-index barha dein
      className="fixed z-[9999] w-48 rounded-md bg-[#202c33] shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
      // UPDATED: Adjusted position use karein
      style={{ top: `${finalPosition.top}px`, left: `${finalPosition.left}px` }}
    >
      {/* Emoji Reactions Bar */}
      <div className="flex justify-around items-center p-2 border-b border-gray-600">
        {EMOJI_REACTIONS.map((emoji) => (
          <span
            key={emoji}
            className="cursor-pointer text-xl hover:scale-125 transition-transform"
            onClick={() => onAction("react", emoji)}
          >
            {emoji}
          </span>
        ))}
      </div>

      {/* Action Menu Items */}
      <ul className="py-1">
        {menuItems.map((item) => (
          <li
            key={item.name}
            className={`
              flex items-center px-4 py-2 text-sm text-gray-300 cursor-pointer
              ${
                item.danger
                  ? "hover:bg-red-500 hover:bg-opacity-20 hover:text-red-400"
                  : "hover:bg-slate-600"
              }
            `}
            onClick={() => onAction(item.name.toLowerCase().replace(/ /g, "-"), message)}
          >
            <Icon icon={item.icon} className="w-5 h-5 mr-3" />
            <span>{item.name}</span>
          </li>
        ))}
      </ul>
    </div>
  );

  // UPDATED: React Portal ka istemal karein
  return ReactDOM.createPortal(menuContent, document.body);
};

export default MessageContextMenu;
// src/components/ui/UserAvatar.jsx

import React from 'react';

const generateHslColor = (name = "") => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
    hash = hash & hash;
  }
  const hue = hash % 360;
  return `hsl(${hue}, 70%, 45%)`;
};

const getInitials = (name = "") => {
  if (!name.trim()) return '?';
  const nameParts = name.split(' ').filter(Boolean);
  if (nameParts.length === 1) return nameParts[0][0].toUpperCase();
  return (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase();
};

const UserAvatar = ({ avatarUrl, fullName, className = 'h-10 w-10' }) => {
  if (avatarUrl) {
    return <img src={avatarUrl} alt={fullName} className={`block object-cover rounded-full ${className}`} />;
  }
  const initials = getInitials(fullName);
  const backgroundColor = generateHslColor(fullName);
  return (
    <div className={`flex items-center justify-center rounded-full text-white font-bold text-sm ${className}`} style={{ backgroundColor }} title={fullName}>
      <span>{initials}</span>
    </div>
  );
};

export default UserAvatar;
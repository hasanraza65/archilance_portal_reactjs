import React from 'react';

const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_BASE_URL;

const generateHslColor = (name = "") => {
  if (!name) return 'hsl(205, 70%, 45%)';
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
    hash = hash & hash;
  }
  const hue = hash % 360;
  return `hsl(${hue}, 70%, 45%)`;
};

const getInitials = (name = "") => {
  if (!name || !name.trim()) return '?';
  const nameParts = name.split(' ').filter(Boolean);
  if (nameParts.length === 1 && nameParts[0].length > 0) return nameParts[0][0].toUpperCase();
  if (nameParts.length > 1) {
    return (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase();
  }
  return '?';
};

const UserAvatar = ({ avatarUrl, fullName, className = 'h-10 w-10' }) => {
  if (avatarUrl) {
    let fullAvatarUrl = avatarUrl;
    if (!avatarUrl.startsWith('http') && !avatarUrl.startsWith('data:')) {
        fullAvatarUrl = `${BACKEND_BASE_URL}/storage/${avatarUrl}`;
    }

    return <img src={fullAvatarUrl} alt={fullName || 'avatar'} className={`block object-cover rounded-full ${className}`} />;
  }
  
  const initials = getInitials(fullName);
  const backgroundColor = generateHslColor(fullName);
  
  return (
    <div 
      className={`flex items-center justify-center rounded-full text-white font-bold text-sm ${className}`} 
      style={{ backgroundColor }} 
      title={fullName}
    >
      <span>{initials}</span>
    </div>
  );
};

export default UserAvatar;
import React, { useState } from 'react';

interface UserAvatarProps {
  avatar?: string;
  name?: string;
  role?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
  showTooltip?: boolean;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  avatar,
  name = 'Участник',
  role,
  size = 'sm',
  className = '',
  showTooltip = true,
}) => {
  const [imgError, setImgError] = useState(false);

  const sizeClasses = {
    xs: 'w-5 h-5 text-[9px]',
    sm: 'w-6 h-6 text-[10px]',
    md: 'w-7 h-7 text-xs',
    lg: 'w-9 h-9 text-sm',
  };

  const initial = name ? name.trim().charAt(0).toUpperCase() : '?';
  const tooltipText = role ? `${name} (${role})` : name;

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 rounded-full select-none ${sizeClasses[size]} ${className}`}
      title={showTooltip ? tooltipText : undefined}
    >
      {avatar && !imgError ? (
        <img
          src={avatar}
          alt={name}
          onError={() => setImgError(true)}
          className="w-full h-full rounded-full object-cover ring-1 ring-black/5 shadow-2xs"
          referrerPolicy="no-referrer"
        />
      ) : (
        <div className="w-full h-full rounded-full bg-gradient-to-tr from-indigo-600 to-slate-800 text-white font-bold flex items-center justify-center ring-1 ring-black/5 shadow-2xs">
          {initial}
        </div>
      )}
    </div>
  );
};

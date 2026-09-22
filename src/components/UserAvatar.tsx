import React, { useState, useEffect } from 'react';

interface UserAvatarProps {
  avatar?: string;
  name?: string;
  role?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
  showTooltip?: boolean;
}

const GRADIENTS = [
  'from-blue-600 to-indigo-600',
  'from-purple-600 to-pink-600',
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-600',
  'from-rose-500 to-red-600',
  'from-sky-500 to-cyan-600',
  'from-violet-600 to-purple-700',
];

function getGradientForName(name: string): string {
  let hash = 0;
  const clean = (name || '').replace(/\s*\([^)]*\)/g, '').trim();
  for (let i = 0; i < clean.length; i++) {
    hash = clean.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % GRADIENTS.length;
  return GRADIENTS[index];
}

function getInitials(name: string): string {
  if (!name) return '?';
  const clean = name.replace(/\s*\([^)]*\)/g, '').trim();
  if (!clean) return '?';
  const display = clean.startsWith('@') ? clean.slice(1) : clean;
  const parts = display.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return display.slice(0, 1).toUpperCase();
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

  useEffect(() => {
    setImgError(false);
  }, [avatar]);

  const sizeClasses = {
    xs: 'w-5 h-5 text-[8.5px]',
    sm: 'w-6 h-6 text-[10px]',
    md: 'w-7 h-7 text-xs',
    lg: 'w-9 h-9 text-sm',
  };

  const initials = getInitials(name);
  const gradient = getGradientForName(name);
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
          className="w-full h-full rounded-full object-cover ring-1 ring-black/10 shadow-2xs"
          referrerPolicy="no-referrer"
          crossOrigin="anonymous"
          loading="lazy"
        />
      ) : (
        <div className={`w-full h-full rounded-full bg-gradient-to-tr ${gradient} text-white font-bold flex items-center justify-center ring-1 ring-black/10 shadow-2xs leading-none tracking-tight`}>
          {initials}
        </div>
      )}
    </div>
  );
};

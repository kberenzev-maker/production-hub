import React, { useState } from 'react';
import { useProduction } from '../context/ProductionContext';
import { TEAM_ROLES } from '../types';
import { ChevronDown, Settings, X, Eye } from 'lucide-react';
import { SettingsModal } from './SettingsModal';

interface HeaderProps {
  currentTab: string;
  setCurrentTab: (tab: any) => void;
  onOpenCreateTask?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ currentTab, setCurrentTab }) => {
  const { 
    impersonatedRole,
    setImpersonatedRole,
    isSettingsOpen,
    setIsSettingsOpen,
    settingsTab,
    syncStatus,
    projects,
    currentProjectId,
    setCurrentProjectId,
    currentUser
  } = useProduction();

  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 bg-white/85 backdrop-blur-md border-b border-[#C6C6C8]/40">
      {/* Impersonation Banner */}
      {impersonatedRole && (
        <div className="bg-[#FF9500] text-white px-4 py-1 text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5" />
            <span>Режим: {impersonatedRole}</span>
          </div>
          <button
            type="button"
            onClick={() => setImpersonatedRole(null)}
            className="text-white hover:text-white/80 font-bold text-xs flex items-center gap-1 cursor-pointer"
          >
            <span>Выйти</span>
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Main Bar: height 48px */}
      <div className="h-12 max-w-7xl mx-auto px-4 flex items-center justify-between gap-2">
        {/* Left: Current Project Selector */}
        <div className="flex items-center gap-2 min-w-0">
          {projects.length > 0 ? (
            <div className="relative inline-flex items-center min-w-0">
              <select
                id="header-project-select"
                value={currentProjectId}
                onChange={(e) => setCurrentProjectId(e.target.value)}
                className="appearance-none bg-[#767680]/12 hover:bg-[#767680]/18 text-black text-[13px] sm:text-[14px] font-semibold py-1.5 pl-3 pr-7 rounded-full cursor-pointer focus:outline-none transition-colors truncate max-w-[150px] sm:max-w-[260px]"
                title="Текущий проект"
              >
                {projects.map(proj => (
                  <option key={proj.id} value={proj.id}>
                    💬 {proj.title}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-[#8E8E93] absolute right-2 pointer-events-none" />
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 text-[14px] font-bold text-black">
              <span>💬 Production Hub</span>
            </div>
          )}
        </div>

        {/* Right: User Profile Pill (TG Name & Roles) + Settings Gear */}
        <div className="flex items-center gap-2 shrink-0">
          {/* User Profile Pill - Clean Minimal TG Login */}
          <div 
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#767680]/12 text-xs font-medium max-w-[200px]"
            title={`Пользователь: ${currentUser.name} (${currentUser.username || 'Telegram'})\nРоли: ${currentUser.roles.map(r => TEAM_ROLES.find(tr => tr.id === r)?.label || r).join(', ')}`}
          >
            {/* Sync Pulse Dot */}
            <span 
              className={`w-2 h-2 rounded-full shrink-0 ${
                syncStatus?.status === 'connected' ? 'bg-[#34C759] animate-pulse' : 'bg-[#FF9500]'
              }`} 
              title={syncStatus?.status === 'connected' ? 'База данных онлайн' : 'Синхронизация...'}
            />
            
            {/* User Login / Handle */}
            <span className="font-semibold text-black truncate text-[12px] sm:text-[13px]">
              {currentUser.username || currentUser.name}
            </span>
          </div>

          {/* Settings Button */}
          <button
            type="button"
            onClick={() => setIsSettingsModalOpen(true)}
            className="w-8 h-8 rounded-full bg-[#767680]/12 text-[#8E8E93] hover:text-[#007AFF] hover:bg-[#767680]/18 flex items-center justify-center transition-colors cursor-pointer"
            title="Настройки"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Settings Modal */}
      {(isSettingsModalOpen || isSettingsOpen) && (
        <SettingsModal
          isOpen={isSettingsModalOpen || isSettingsOpen}
          onClose={() => {
            setIsSettingsModalOpen(false);
            setIsSettingsOpen(false);
          }}
          initialTab={settingsTab}
        />
      )}
    </header>
  );
};

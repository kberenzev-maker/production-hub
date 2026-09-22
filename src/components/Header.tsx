import React, { useState } from 'react';
import { useProduction } from '../context/ProductionContext';
import { UserRole } from '../types';
import { ChevronDown, Settings, X, Eye, Plus } from 'lucide-react';
import { TeamManagementModal } from './TeamManagementModal';
import { SettingsModal } from './SettingsModal';

interface HeaderProps {
  currentTab: string;
  setCurrentTab: (tab: any) => void;
  onOpenCreateTask?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ currentTab, setCurrentTab, onOpenCreateTask }) => {
  const { 
    impersonatedRole,
    setImpersonatedRole,
    activeRole,
    currentExpertId, 
    setCurrentExpertId, 
    experts,
    projectName,
    isSettingsOpen,
    setIsSettingsOpen,
    settingsTab,
    syncStatus,
    projects,
    currentProjectId,
    setCurrentProjectId,
    scaffoldProjectTopics
  } = useProduction();

  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  const isProducer = activeRole === 'super_admin';

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
      <div className="h-12 max-w-7xl mx-auto px-4 flex items-center justify-between gap-3">
        {/* Left: Project Selector (Telegram Chats) & Inline Expert Select */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="relative inline-flex items-center min-w-0">
            <select
              id="header-project-select"
              value={currentProjectId}
              onChange={(e) => setCurrentProjectId(e.target.value)}
              className="appearance-none bg-[#767680]/12 hover:bg-[#767680]/18 text-black text-[13px] sm:text-[14px] font-semibold py-1 pl-2.5 pr-6 rounded-full cursor-pointer focus:outline-none transition-colors truncate max-w-[150px] sm:max-w-[220px]"
              title="Выбрать проект (чат)"
            >
              {projects.map(proj => (
                <option key={proj.id} value={proj.id}>
                  💬 {proj.title}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-[#8E8E93] absolute right-2 pointer-events-none" />
          </div>

          <span className="text-[#8E8E93] text-sm shrink-0">/</span>

          {/* Native Inline Select */}
          <div className="relative inline-flex items-center min-w-0">
            <select
              id="header-expert-select"
              value={currentExpertId}
              onChange={(e) => setCurrentExpertId(e.target.value)}
              className="appearance-none bg-[#767680]/12 hover:bg-[#767680]/18 text-black text-[12px] sm:text-[13px] font-medium py-1 pl-2.5 pr-6 rounded-full cursor-pointer focus:outline-none transition-colors truncate max-w-[100px] sm:max-w-[140px]"
            >
              {experts.map(exp => (
                <option key={exp.id} value={exp.id}>
                  {exp.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-[#8E8E93] absolute right-2 pointer-events-none" />
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Realtime Sync Badge */}
          <div 
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-medium select-none"
            style={{
              backgroundColor: syncStatus?.status === 'connected' ? 'rgba(52, 199, 89, 0.12)' : syncStatus?.status === 'connecting' ? 'rgba(255, 149, 0, 0.12)' : 'rgba(142, 142, 147, 0.12)',
              color: syncStatus?.status === 'connected' ? '#248A3D' : syncStatus?.status === 'connecting' ? '#C97500' : '#8E8E93'
            }}
            title={syncStatus?.status === 'connected' ? `База данных синхронизирована в реальном времени. В сети: ${syncStatus.clientCount}` : 'Синхронизация с базой...'}
          >
            <span className={`w-2 h-2 rounded-full ${syncStatus?.status === 'connected' ? 'bg-[#34C759] animate-pulse' : syncStatus?.status === 'connecting' ? 'bg-[#FF9500] animate-pulse' : 'bg-[#8E8E93]'}`} />
            <span className="hidden xs:inline">
              {syncStatus?.status === 'connected' 
                ? (syncStatus.clientCount > 1 ? `${syncStatus.clientCount} в сети` : 'База онлайн')
                : syncStatus?.status === 'connecting' ? 'Синхронизация...' : 'Офлайн'}
            </span>
          </div>

          {onOpenCreateTask && (
            <button
              type="button"
              onClick={onOpenCreateTask}
              className="w-8 h-8 rounded-full bg-[#007AFF] text-white flex items-center justify-center hover:bg-[#007AFF]/90 transition-colors cursor-pointer"
              title="Создать задачу"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}

          {isProducer && (
            <button
              type="button"
              onClick={() => setIsSettingsModalOpen(true)}
              className="w-8 h-8 rounded-full bg-[#767680]/12 text-[#007AFF] hover:bg-[#767680]/18 flex items-center justify-center transition-colors cursor-pointer"
              title="Настройки"
            >
              <Settings className="w-4 h-4" />
            </button>
          )}
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

      {/* Team Modal */}
      {isTeamModalOpen && (
        <TeamManagementModal 
          isOpen={isTeamModalOpen}
          onClose={() => setIsTeamModalOpen(false)}
        />
      )}
    </header>
  );
};

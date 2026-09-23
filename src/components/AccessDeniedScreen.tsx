import React, { useState } from 'react';
import { ShieldX, RefreshCw, Send, Users, AlertCircle } from 'lucide-react';
import { UserAvatar } from './UserAvatar';
import { useProduction } from '../context/ProductionContext';

interface AccessDeniedScreenProps {
  projectName: string;
}

export const AccessDeniedScreen: React.FC<AccessDeniedScreenProps> = ({ projectName }) => {
  const { currentUser, refreshData } = useProduction();
  const [isChecking, setIsChecking] = useState(false);

  const handleRefresh = async () => {
    setIsChecking(true);
    try {
      if (refreshData) {
        await refreshData();
      }
    } finally {
      setTimeout(() => setIsChecking(false), 800);
    }
  };

  return (
    <div className="min-h-screen bg-[#F2F2F7] flex flex-col items-center justify-center p-4 selection:bg-[#007AFF]/20 selection:text-[#007AFF]">
      <div className="w-full max-w-sm bg-white rounded-3xl p-6 sm:p-7 shadow-[0_12px_40px_rgba(0,0,0,0.08)] border border-black/5 text-center space-y-5 animate-in fade-in zoom-in-95 duration-200">
        
        {/* User Profile Badge */}
        <div className="flex flex-col items-center space-y-2">
          <div className="relative">
            <UserAvatar 
              avatar={currentUser.avatar} 
              name={currentUser.name} 
              size="lg" 
              className="ring-4 ring-slate-100 shadow-md"
            />
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-rose-500 border-2 border-white flex items-center justify-center shadow-sm">
              <ShieldX className="w-3.5 h-3.5 text-white stroke-[2.5]" />
            </div>
          </div>

          <div>
            <h2 className="text-base font-bold text-slate-900">
              {currentUser.name}
            </h2>
            {currentUser.username && (
              <p className="text-xs font-mono text-slate-400">
                {currentUser.username}
              </p>
            )}
          </div>
        </div>

        {/* Title & Description */}
        <div className="space-y-2 pt-1 border-t border-slate-100">
          <h1 className="text-lg font-bold text-slate-900 tracking-tight flex items-center justify-center gap-1.5 text-rose-600">
            <span>Доступ к проекту ограничен</span>
          </h1>
          <p className="text-[13px] text-slate-600 leading-relaxed">
            Ваш аккаунт пока не добавлен в команду проекта <span className="font-semibold text-slate-900">«{projectName}»</span>.
          </p>
        </div>

        {/* Instructions Card */}
        <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-3.5 text-left text-xs text-amber-950 space-y-1.5">
          <div className="font-semibold flex items-center gap-1.5 text-amber-900">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Что нужно сделать:</span>
          </div>
          <p className="text-[12px] text-amber-900/80 leading-normal">
            Попросите продюсера или администратора проекта открыть <span className="font-semibold">«Настройки ⚙️ → Команда»</span> и добавить ваш Telegram логин <span className="font-mono font-semibold bg-amber-100/80 px-1 py-0.5 rounded text-amber-900">{currentUser.username || currentUser.name}</span>.
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-2.5 pt-1">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isChecking}
            className="w-full py-3 px-4 bg-[#007AFF] hover:bg-[#0062cc] active:scale-[0.98] text-white font-semibold text-sm rounded-2xl shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
            <span>{isChecking ? 'Проверяем права...' : 'Проверить доступ снова'}</span>
          </button>
        </div>

      </div>

      <div className="mt-6 text-[11px] text-slate-400 flex items-center gap-1.5">
        <Users className="w-3.5 h-3.5 text-slate-400" />
        <span>Production Hub · Управление доступом команды</span>
      </div>
    </div>
  );
};

import React from 'react';
import { useProduction } from '../context/ProductionContext';
import { UserRole } from '../types';
import { Code2, ArrowLeft, Check, Video, Scissors, Palette, Send, User } from 'lucide-react';

interface StaticFooterProps {
  currentTab?: string;
  onNavigateToCalls?: () => void;
}

export const StaticFooter: React.FC<StaticFooterProps> = ({
  currentTab,
  onNavigateToCalls
}) => {
  const { 
    isDevModeActive, 
    setIsDevModeActive, 
    exitDevMode, 
    activeRole, 
    setImpersonatedRole,
    calls,
    currentExpertId
  } = useProduction();

  const devRoles: { role: UserRole; title: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { role: 'editor', title: 'Монтажёр', icon: Scissors },
    { role: 'designer', title: 'Дизайнер', icon: Palette },
    { role: 'publisher', title: 'Ассистент', icon: Send },
    { role: 'expert', title: 'Эксперт', icon: User },
  ];

  const expertCalls = calls.filter(c => c.expertId === currentExpertId);

  const handleActivateDevMode = () => {
    setIsDevModeActive(true);
    if (activeRole === 'super_admin') {
      setImpersonatedRole('editor');
    }
  };

  return (
    <footer className="sticky bottom-0 z-30 md:hidden bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] py-2 px-3 sm:px-6">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs">
        {/* Left Side: status or dev description */}
        <div className="flex items-center gap-3 text-slate-600 font-medium">
          {isDevModeActive ? (
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
              </span>
              <span className="text-amber-800 font-bold text-xs sm:text-sm">
                Режим разработки:
              </span>
              <span className="text-slate-500 hidden md:inline text-xs">
                (симуляция роли)
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-slate-500 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>Режим: <b className="text-slate-800 font-semibold">Продюсер</b></span>
            </div>
          )}

          {/* Calls button placed in footer */}
          {onNavigateToCalls && (
            <button
              type="button"
              onClick={onNavigateToCalls}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                currentTab === 'calls'
                  ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs font-bold'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200/80 hover:text-indigo-600'
              }`}
              title="Перейти к созвонам команды"
            >
              <Video className="w-3.5 h-3.5 text-indigo-500" />
              <span>Созвоны</span>
              {expertCalls.length > 0 && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  currentTab === 'calls' ? 'bg-white/20 text-white' : 'bg-indigo-100 text-indigo-800'
                }`}>
                  {expertCalls.length}
                </span>
              )}
            </button>
          )}
        </div>

        {/* Right Side / Role switcher & Main Toggle Button */}
        <div className="flex flex-wrap items-center justify-center gap-2 w-full sm:w-auto">
          {isDevModeActive ? (
            <>
              {/* Role Switcher Pills */}
              <div className="flex items-center bg-slate-100 p-1 rounded-xl gap-1 border border-slate-200">
                {devRoles.map((r) => {
                  const isSelected = activeRole === r.role;
                  return (
                    <button
                      key={r.role}
                      type="button"
                      onClick={() => setImpersonatedRole(r.role)}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-white text-indigo-700 shadow-xs font-bold border border-slate-200/80 scale-[1.02]'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                      }`}
                    >
                      <r.icon className="w-3.5 h-3.5" />
                      <span>{r.title}</span>
                      {isSelected && <Check className="w-3 h-3 text-indigo-600 stroke-[3]" />}
                    </button>
                  );
                })}
              </div>

              {/* Exit Button: «вернуться в режим продюсера» */}
              <button
                type="button"
                onClick={exitDevMode}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-slate-900 to-indigo-950 hover:from-slate-800 hover:to-indigo-900 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Вернуться в режим продюсера</span>
              </button>
            </>
          ) : (
            /* Activation Button: «перейти в режим разработки» */
            <button
              type="button"
              onClick={handleActivateDevMode}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs shadow-2xs transition-all cursor-pointer"
            >
              <Code2 className="w-4 h-4 text-amber-700" />
              <span>Режим разработки</span>
            </button>
          )}
        </div>
      </div>
    </footer>
  );
};

import React from 'react';
import { Calendar as CalendarIcon, Layers, Send, Video, CheckSquare } from 'lucide-react';

export type MainTabType = 'plan' | 'content' | 'tasks' | 'publish' | 'calls';

interface BottomTabBarProps {
  activeTab: MainTabType;
  onTabChange: (tab: MainTabType) => void;
  badgeCounts?: {
    plan?: number;
    content?: number;
    tasks?: number;
    publish?: number;
    calls?: number;
  };
}

export const BottomTabBar: React.FC<BottomTabBarProps> = ({
  activeTab,
  onTabChange,
  badgeCounts
}) => {
  const tabs: { id: MainTabType; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'plan', label: 'План', icon: CalendarIcon },
    { id: 'content', label: 'Контент', icon: Layers },
    { id: 'tasks', label: 'Задачи', icon: CheckSquare },
    { id: 'publish', label: 'Публикация', icon: Send },
    { id: 'calls', label: 'Созвоны', icon: Video }
  ];

  return (
    <nav 
      aria-label="Навигация"
      className="fixed bottom-0 left-0 right-0 z-40 bg-[#F9F9F9]/85 backdrop-blur-md border-t border-[#C6C6C8]/40 px-2 pt-1 pb-[max(0.5rem,env(safe-area-inset-bottom))]"
    >
      <div className="max-w-md mx-auto grid grid-cols-5 gap-0.5">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const count = badgeCounts?.[tab.id];

          return (
            <button
              key={tab.id}
              id={`tab-${tab.id}`}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className="flex flex-col items-center justify-center py-1 rounded-lg transition-colors relative cursor-pointer group select-none"
            >
              <div className="relative">
                <Icon 
                  className={`w-5 h-5 transition-transform ${
                    isActive ? 'text-[#007AFF] stroke-[2.2]' : 'text-[#8E8E93] group-hover:text-black'
                  }`} 
                />
                {!!count && (
                  <span className="absolute -top-1.5 -right-2.5 bg-[#FF3B30] text-white text-[10px] font-semibold px-1 rounded-full min-w-[15px] h-[15px] flex items-center justify-center leading-none">
                    {count}
                  </span>
                )}
              </div>
              <span 
                className={`text-[10px] mt-0.5 font-medium tracking-tight ${
                  isActive ? 'text-[#007AFF]' : 'text-[#8E8E93]'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

import React from 'react';
import { Plus, MessageSquare, ShieldCheck, Sparkles, ArrowRight } from 'lucide-react';

export const EmptyProjectsOnboarding: React.FC = () => {
  const botUsername = 'content_production_hub_bot';
  const addBotLink = `https://t.me/${botUsername}?startgroup=true`;

  const handleAddBotClick = () => {
    if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp?.openTelegramLink) {
      (window as any).Telegram.WebApp.openTelegramLink(addBotLink);
    } else {
      window.open(addBotLink, '_blank');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 py-8 max-w-lg mx-auto text-center">
      {/* Icon Badge */}
      <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-[#007AFF] to-[#5856D6] flex items-center justify-center shadow-lg shadow-[#007AFF]/25 mb-6">
        <Sparkles className="w-10 h-10 text-white" />
      </div>

      {/* Header */}
      <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-black mb-3">
        Подключите первый проект
      </h2>
      <p className="text-[15px] text-[#8E8E93] leading-relaxed mb-8 max-w-md">
        Production Hub работает в связке с рабочей супергруппой эксперта в Telegram. 
        Добавьте бота в группу — он сам создаст 9 топиков конвейера и подключит проект.
      </p>

      {/* Main Action Button */}
      <button
        type="button"
        onClick={handleAddBotClick}
        className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-[#007AFF] hover:bg-[#007AFF]/90 active:scale-[0.98] text-white font-semibold text-[16px] shadow-md shadow-[#007AFF]/20 transition-all flex items-center justify-center gap-2 cursor-pointer mb-8"
      >
        <Plus className="w-5 h-5 stroke-[2.5]" />
        <span>Добавить бота в группу</span>
      </button>

      {/* 3 Step Instruction Card */}
      <div className="w-full bg-white rounded-2xl border border-[#C6C6C8]/40 p-5 shadow-sm text-left space-y-4 mb-6">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#8E8E93]">
          Как это работает (3 шага)
        </h3>

        {/* Step 1 */}
        <div className="flex items-start gap-3.5">
          <div className="w-8 h-8 rounded-xl bg-[#007AFF]/10 text-[#007AFF] flex items-center justify-center font-bold text-sm shrink-0 mt-0.5">
            1
          </div>
          <div>
            <h4 className="text-sm font-semibold text-black">Создайте супергруппу с темами</h4>
            <p className="text-xs text-[#8E8E93] mt-0.5">
              В настройках группы Telegram включите опцию <strong>«Темы» (Topics / Форум)</strong>.
            </p>
          </div>
        </div>

        {/* Step 2 */}
        <div className="flex items-start gap-3.5">
          <div className="w-8 h-8 rounded-xl bg-[#5856D6]/10 text-[#5856D6] flex items-center justify-center font-bold text-sm shrink-0 mt-0.5">
            2
          </div>
          <div>
            <h4 className="text-sm font-semibold text-black">Добавьте бота как администратора</h4>
            <p className="text-xs text-[#8E8E93] mt-0.5">
              Добавьте <strong>@{botUsername}</strong> и предоставьте права управления темами.
            </p>
          </div>
        </div>

        {/* Step 3 */}
        <div className="flex items-start gap-3.5">
          <div className="w-8 h-8 rounded-xl bg-[#34C759]/10 text-[#34C759] flex items-center justify-center font-bold text-sm shrink-0 mt-0.5">
            3
          </div>
          <div>
            <h4 className="text-sm font-semibold text-black">Бот настроит всё автоматически</h4>
            <p className="text-xs text-[#8E8E93] mt-0.5">
              Бот создаст 9 рабочих топиков конвейера, и проект <strong>мгновенно появится здесь</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* Realtime Waiting Indicator */}
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#767680]/10 text-xs font-medium text-[#8E8E93]">
        <span className="w-2 h-2 rounded-full bg-[#007AFF] animate-ping" />
        <span>Ожидаем подключения группы в Telegram...</span>
      </div>
    </div>
  );
};

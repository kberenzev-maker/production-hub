import React, { useState } from 'react';
import { Lock, Send, KeyRound, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';

interface TelegramAuthGateProps {
  onDevUnlock: () => void;
}

export const TelegramAuthGate: React.FC<TelegramAuthGateProps> = ({ onDevUnlock }) => {
  const [showDevInput, setShowDevInput] = useState(false);
  const [devCode, setDevCode] = useState('');
  const [devError, setDevError] = useState(false);

  const handleDevSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = devCode.trim().toLowerCase();
    if (trimmed === '777' || trimmed === 'dev' || trimmed === 'admin' || trimmed === 'prod') {
      try {
        localStorage.setItem('ph_dev_access', 'true');
      } catch {}
      onDevUnlock();
    } else {
      setDevError(true);
      setTimeout(() => setDevError(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-[#F2F2F7] flex flex-col items-center justify-center p-4 selection:bg-[#007AFF]/20 selection:text-[#007AFF]">
      <div className="w-full max-w-sm bg-white rounded-3xl p-6 sm:p-7 shadow-[0_12px_40px_rgba(0,0,0,0.08)] border border-black/5 text-center space-y-5 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Telegram Shield Icon Badge */}
        <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#007AFF] to-[#5856D6] flex items-center justify-center shadow-lg shadow-blue-500/25 relative">
          <Send className="w-8 h-8 text-white -translate-x-0.5 translate-y-0.5" />
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white flex items-center justify-center shadow-sm">
            <Lock className="w-3.5 h-3.5 text-slate-700" />
          </div>
        </div>

        {/* Title & Description */}
        <div className="space-y-2">
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Доступ только через Telegram
          </h1>
          <p className="text-[13px] text-slate-500 leading-relaxed px-1">
            Это закрытое корпоративное пространство команды производства контента. Доступ разрешён только через Telegram-бота.
          </p>
        </div>

        {/* Instructions Card */}
        <div className="bg-[#F2F2F7]/80 rounded-2xl p-3.5 text-left text-xs text-slate-600 space-y-1.5 border border-black/5">
          <div className="font-semibold text-slate-800 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-[#007AFF] shrink-0" />
            <span>Как войти в приложение:</span>
          </div>
          <ol className="list-decimal list-inside space-y-1 text-slate-500 text-[12px] pl-1 leading-normal">
            <li>Откройте бота <span className="font-semibold text-[#007AFF]">@content_production_hub_bot</span></li>
            <li>Нажмите кнопку меню <span className="font-medium text-slate-700">«Открыть Production Hub»</span></li>
            <li>Либо нажмите кнопку в вашем рабочем чате</li>
          </ol>
        </div>

        {/* Primary Action Button */}
        <div className="space-y-3 pt-1">
          <a
            href="https://t.me/content_production_hub_bot"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3.5 px-4 bg-[#007AFF] hover:bg-[#0062cc] active:scale-[0.98] text-white font-semibold text-sm rounded-2xl shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" />
            <span>Открыть бота в Telegram</span>
            <ArrowRight className="w-4 h-4 opacity-70 ml-0.5" />
          </a>

          {/* Dev Bypass Section */}
          {!showDevInput ? (
            <button
              type="button"
              onClick={() => setShowDevInput(true)}
              className="text-[11.5px] text-slate-400 hover:text-slate-600 font-medium transition-colors cursor-pointer py-1"
            >
              Вход для разработчика (ПК)
            </button>
          ) : (
            <form onSubmit={handleDevSubmit} className="pt-2 border-t border-slate-100 space-y-2 animate-in fade-in">
              <div className="flex gap-1.5">
                <div className="relative flex-1">
                  <KeyRound className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    autoFocus
                    value={devCode}
                    onChange={(e) => setDevCode(e.target.value)}
                    placeholder="Код разработчика"
                    className={`w-full pl-8 pr-2.5 py-1.5 text-xs bg-slate-50 border rounded-xl focus:outline-none transition-colors ${
                      devError 
                        ? 'border-red-400 bg-red-50/50 text-red-700' 
                        : 'border-slate-200 focus:border-[#007AFF]'
                    }`}
                  />
                </div>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 cursor-pointer transition-colors shrink-0"
                >
                  Войти
                </button>
              </div>
              <p className="text-[10px] text-slate-400">
                (Подсказка: введите <span className="font-mono text-slate-600">777</span> или добавьте <span className="font-mono text-slate-600">?dev=true</span> в URL)
              </p>
            </form>
          )}
        </div>

      </div>

      <div className="mt-6 text-[11px] text-slate-400 flex items-center gap-1.5">
        <Sparkles className="w-3.5 h-3.5 text-slate-400" />
        <span>Production Hub · Закрытая система управления контентом</span>
      </div>
    </div>
  );
};

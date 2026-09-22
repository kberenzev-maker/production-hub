import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useProduction } from '../context/ProductionContext';
import { UserRole } from '../types';
import { 
  X, 
  Settings, 
  Sliders, 
  MessageSquare, 
  Users, 
  Check, 
  Save, 
  Film, 
  Layers, 
  Flame, 
  ShieldCheck, 
  User,
  Shield,
  Trash2,
  AlertTriangle,
  RotateCcw,
  Calendar,
  Sparkles,
  Bot,
  ExternalLink,
  FolderKanban,
  CheckCircle2,
  RefreshCw,
  FolderPlus
} from 'lucide-react';
import { TeamManagementModal } from './TeamManagementModal';
import { WeekDayShort } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'norms' | 'project' | 'team' | 'schedule' | 'bot' | 'system';
}

const ALL_WEEKDAYS: { id: WeekDayShort; label: string; full: string }[] = [
  { id: 'пн', label: 'ПН', full: 'Понедельник' },
  { id: 'вт', label: 'ВТ', full: 'Вторник' },
  { id: 'ср', label: 'СР', full: 'Среда' },
  { id: 'чт', label: 'ЧТ', full: 'Четверг' },
  { id: 'пт', label: 'ПТ', full: 'Пятница' },
  { id: 'сб', label: 'СБ', full: 'Суббота' },
];

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, initialTab }) => {
  const { 
    norms, 
    updateNorms, 
    projectName, 
    setProjectName, 
    chatTitle, 
    setChatTitle, 
    telegramHandle, 
    setTelegramHandle,
    currentRole,
    chatUsers,
    updateUserRole,
    clearAllTasks,
    resetAllData,
    weeklySchedule,
    updateWeeklySchedule,
    setIsWeeklyPlannerOpen,
    projects,
    currentProjectId,
    setCurrentProjectId,
    scaffoldProjectTopics
  } = useProduction();

  const [activeSubTab, setActiveSubTab] = useState<'norms' | 'project' | 'team' | 'schedule' | 'bot' | 'system'>(initialTab || 'norms');

  React.useEffect(() => {
    if (initialTab) {
      setActiveSubTab(initialTab);
    }
  }, [initialTab]);

  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [confirmResetTasks, setConfirmResetTasks] = useState(false);
  const [resetSuccessMessage, setResetSuccessMessage] = useState<string | null>(null);

  // Form state
  const [reelsNorm, setReelsNorm] = useState(norms.monthPlanReels);
  const [carouselsNorm, setCarouselsNorm] = useState(norms.monthPlanCarousels);
  const [storiesNorm, setStoriesNorm] = useState(norms.monthPlanStories);
  const [bufferTarget, setBufferTarget] = useState(norms.bufferTarget);

  const [localProjectName, setLocalProjectName] = useState(projectName);
  const [localChatTitle, setLocalChatTitle] = useState(chatTitle);
  const [localTgHandle, setLocalTgHandle] = useState(telegramHandle);

  const currentProject = projects.find(p => p.id === currentProjectId) || projects[0];
  const [scaffoldChatId, setScaffoldChatId] = useState<string>(
    currentProject ? String(currentProject.chatId) : '-1002145893201'
  );
  const [scaffoldChatTitle, setScaffoldChatTitle] = useState<string>(
    currentProject ? currentProject.title : projectName
  );
  const [isScaffolding, setIsScaffolding] = useState(false);
  const [scaffoldSuccess, setScaffoldSuccess] = useState<string | null>(null);

  React.useEffect(() => {
    if (currentProject) {
      setScaffoldChatId(String(currentProject.chatId));
      setScaffoldChatTitle(currentProject.title);
    }
  }, [currentProjectId, currentProject]);

  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!isOpen) return null;
  if (typeof document === 'undefined') return null;

  const handleSaveNorms = (e: React.FormEvent) => {
    e.preventDefault();
    updateNorms({
      monthPlanReels: Number(reelsNorm),
      monthPlanCarousels: Number(carouselsNorm),
      monthPlanStories: Number(storiesNorm),
      bufferTarget: Number(bufferTarget)
    });
    setProjectName(localProjectName.trim() || '[project name]');
    setChatTitle(localChatTitle.trim() || 'chat_supergroup');
    setTelegramHandle(localTgHandle.trim() || 'kirillber');

    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 800);
  };

  return createPortal(
    <div 
      className="fixed inset-0 z-[100] overflow-y-auto bg-black/60 backdrop-blur-xs p-3 sm:p-4 flex flex-col justify-center items-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[calc(100dvh-2rem)] sm:max-h-[85vh] my-auto border border-slate-200/80 animate-in fade-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-3.5 sm:py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base leading-tight">Настройки системы</h3>
              <p className="text-xs text-slate-500">Нормативы, проект, чат и интеграция</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub-tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50/50 px-4 sm:px-5 pt-2 gap-1 sm:gap-2 text-xs font-semibold shrink-0 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveSubTab('norms')}
            className={`pb-2 px-2.5 sm:px-3 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeSubTab === 'norms'
                ? 'border-indigo-600 text-indigo-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Нормативы и буфер</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('project')}
            className={`pb-2 px-2.5 sm:px-3 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeSubTab === 'project'
                ? 'border-indigo-600 text-indigo-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Проект и Чат</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('bot')}
            className={`pb-2 px-2.5 sm:px-3 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeSubTab === 'bot'
                ? 'border-indigo-600 text-indigo-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>Telegram Бот</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('schedule')}
            className={`pb-2 px-2.5 sm:px-3 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeSubTab === 'schedule'
                ? 'border-indigo-600 text-indigo-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Ритм недели</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('team')}
            className={`pb-2 px-2.5 sm:px-3 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeSubTab === 'team'
                ? 'border-indigo-600 text-indigo-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Участники и роли</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('system')}
            className={`pb-2 px-2.5 sm:px-3 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeSubTab === 'system'
                ? 'border-rose-600 text-rose-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-500" />
            <span>Управление данными и сброс</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSaveNorms} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1 min-h-0 text-xs text-slate-700">
            {activeSubTab === 'norms' && (
              <div className="space-y-4">
                <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3 text-amber-900 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-amber-700" />
                    Управление производственными нормативами
                  </div>
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    Супер-админ может гибко настраивать месячные планы раздельно для Reels, Каруселей и Stories, а также порог буфера безопасности.
                  </p>
                </div>

                {/* Reels Norm */}
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-800 flex items-center gap-1.5">
                      <Film className="w-4 h-4 text-purple-600" />
                      Норматив Reels (в месяц):
                    </label>
                    <span className="font-mono font-bold text-indigo-700 bg-white px-2.5 py-0.5 rounded border border-slate-200">
                      {reelsNorm} ед.
                    </span>
                  </div>
                  <input
                    type="range"
                    min="2"
                    max="30"
                    step="1"
                    value={reelsNorm}
                    onChange={(e) => setReelsNorm(Number(e.target.value))}
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>Мин: 2</span>
                    <span>Темп: ~{Math.round(reelsNorm / 4)} в неделю</span>
                    <span>Макс: 30</span>
                  </div>
                </div>

                {/* Carousel Norm */}
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-800 flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-blue-600" />
                      Норматив Карусели (в месяц):
                    </label>
                    <span className="font-mono font-bold text-blue-700 bg-white px-2.5 py-0.5 rounded border border-slate-200">
                      {carouselsNorm} ед.
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="20"
                    step="1"
                    value={carouselsNorm}
                    onChange={(e) => setCarouselsNorm(Number(e.target.value))}
                    className="w-full accent-blue-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>Мин: 1</span>
                    <span>Темп: ~{Math.round(carouselsNorm / 4)} в неделю</span>
                    <span>Макс: 20</span>
                  </div>
                </div>

                {/* Stories Norm */}
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-800 flex items-center gap-1.5">
                      <Flame className="w-4 h-4 text-orange-500" />
                      Норматив Stories (пакетов в месяц):
                    </label>
                    <span className="font-mono font-bold text-orange-700 bg-white px-2.5 py-0.5 rounded border border-slate-200">
                      {storiesNorm} ед.
                    </span>
                  </div>
                  <input
                    type="range"
                    min="2"
                    max="30"
                    step="1"
                    value={storiesNorm}
                    onChange={(e) => setStoriesNorm(Number(e.target.value))}
                    className="w-full accent-orange-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>Мин: 2</span>
                    <span>Темп: ~{Math.round(storiesNorm / 4)} в неделю</span>
                    <span>Макс: 30</span>
                  </div>
                </div>

                {/* Safe Buffer Target */}
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-800 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      Минимальный буфер безопасности (готовый контент):
                    </label>
                    <span className="font-mono font-bold text-emerald-700 bg-white px-2.5 py-0.5 rounded border border-slate-200">
                      {bufferTarget} ед.
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="12"
                    step="1"
                    value={bufferTarget}
                    onChange={(e) => setBufferTarget(Number(e.target.value))}
                    className="w-full accent-emerald-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>Мин: 1 ед.</span>
                    <span>Рекомендуется: 4 единицы на период</span>
                    <span>Макс: 12 ед.</span>
                  </div>
                </div>
              </div>
            )}

            {activeSubTab === 'project' && (
              <div className="space-y-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Название проекта:
                  </label>
                  <input
                    type="text"
                    value={localProjectName}
                    onChange={(e) => setLocalProjectName(e.target.value)}
                    placeholder="[project name]"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Отображается в статическом блоке под хедером.
                  </p>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Имя супергруппы / чата в Telegram:
                  </label>
                  <div className="flex items-center">
                    <span className="px-2.5 py-2 bg-slate-100 border border-r-0 border-slate-200 rounded-l-lg text-slate-500">
                      @
                    </span>
                    <input
                      type="text"
                      value={localChatTitle.replace(/^@/, '')}
                      onChange={(e) => setLocalChatTitle(e.target.value)}
                      placeholder="production_supergroup"
                      className="flex-1 px-3 py-2 border border-slate-200 rounded-r-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Привязка к Telegram супергруппе проекта.
                  </p>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-rose-500" />
                    Ваш логин в Telegram:
                  </label>
                  <input
                    type="text"
                    value={localTgHandle}
                    onChange={(e) => setLocalTgHandle(e.target.value)}
                    placeholder="kirillber"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Отображается в хедере напротив названия приложения с указанием роли.
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsTeamModalOpen(true)}
                    className="w-full py-2 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <Users className="w-4 h-4 text-indigo-600" />
                    <span>Открыть расширенное окно участников</span>
                  </button>
                </div>
              </div>
            )}

            {activeSubTab === 'bot' && (
              <div className="space-y-4">
                {/* Bot Status Banner */}
                <div className="bg-gradient-to-r from-sky-50 to-indigo-50 border border-sky-200 rounded-xl p-3.5 text-sky-950 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="font-bold flex items-center gap-1.5 text-xs">
                      <Bot className="w-4 h-4 text-sky-600" />
                      <span>Telegram Бот и Архитектура топиков</span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      Синхронизация активна
                    </span>
                  </div>
                  <p className="text-[11px] text-sky-900/90 leading-relaxed">
                    Каждая супергруппа Telegram — это изолированный проект со своей структурой из 9 топиков. Бот автоматически создает топики, принимает идеи через ЛС, удаляет мусор при создании созвонов и присылает напоминания за 1ч и 15м.
                  </p>
                </div>

                {/* Scaffolding Section */}
                <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs space-y-3">
                  <div className="space-y-1">
                    <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                      <FolderKanban className="w-4 h-4 text-indigo-600" />
                      <span>Авто-создание 9 топиков в чате (Скэффолдинг)</span>
                    </h4>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Введите Chat ID супергруппы (начинается с <code className="text-slate-700 bg-slate-100 px-1 py-0.5 rounded font-mono">-100...</code>) и название проекта. Бот вызовет метод <code className="text-slate-700 bg-slate-100 px-1 py-0.5 rounded font-mono">createForumTopic</code> для всех 9 этапов производства.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Chat ID группы:
                      </label>
                      <input
                        type="text"
                        value={scaffoldChatId}
                        onChange={(e) => setScaffoldChatId(e.target.value)}
                        placeholder="-1002145893201"
                        className="w-full px-3 py-1.5 text-xs font-mono border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Название проекта / чата:
                      </label>
                      <input
                        type="text"
                        value={scaffoldChatTitle}
                        onChange={(e) => setScaffoldChatTitle(e.target.value)}
                        placeholder="Экспертный блог"
                        className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {scaffoldSuccess && (
                    <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-medium flex items-center gap-2 animate-in fade-in">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{scaffoldSuccess}</span>
                    </div>
                  )}

                  <button
                    type="button"
                    disabled={isScaffolding}
                    onClick={() => {
                      const numChatId = Number(scaffoldChatId);
                      if (!numChatId) {
                        alert('Пожалуйста, введите корректный числовой ID чата (напр. -1002145893201)');
                        return;
                      }
                      setIsScaffolding(true);
                      scaffoldProjectTopics(numChatId, scaffoldChatTitle.trim() || 'Новый проект');
                      setScaffoldSuccess(`Топики для «${scaffoldChatTitle.trim() || 'Проект'}» успешно инициализированы!`);
                      setTimeout(() => {
                        setIsScaffolding(false);
                      }, 1000);
                      setTimeout(() => {
                        setScaffoldSuccess(null);
                      }, 4000);
                    }}
                    className="w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer disabled:opacity-50"
                  >
                    {isScaffolding ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Создание топиков...</span>
                      </>
                    ) : (
                      <>
                        <FolderPlus className="w-3.5 h-3.5" />
                        <span>🚀 Развернуть 9 топиков в чате</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Topics Blueprint / Current Project Topics */}
                <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                      <span>Структура топиков проекта ({currentProject?.title || projectName})</span>
                    </h4>
                    <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      ID: {currentProject?.chatId || scaffoldChatId}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    {[
                      { num: '1', title: '⚡ 1. Идеи и подборки', key: 'ideas', desc: 'Запись войсов в ЛС бота и референсы (YouTube/Instagram)', id: currentProject?.topics?.ideas || 101 },
                      { num: '2', title: '📝 2. Сценарии', key: 'scripts', desc: 'Утверждение сценариев после одобрения идеи', id: currentProject?.topics?.scripts || 102 },
                      { num: '3', title: '🎬 3. Съёмка', key: 'shooting', desc: 'Утверждённые сценарии, назначение даты съемки', id: currentProject?.topics?.shooting || 103 },
                      { num: '4', title: '📁 4. Материалы', key: 'materials', desc: 'Загрузка дублей экспертом, фиксация ссылки на первое сообщение', id: currentProject?.topics?.materials || 104 },
                      { num: '5', title: '📱 5. Рилсы', key: 'reels', desc: 'Смонтированные Reels, версионирование и рендеры', id: currentProject?.topics?.reels || 105 },
                      { num: '6', title: '🎠 6. Карусели', key: 'carousels', desc: 'Готовые карусели и слайды', id: currentProject?.topics?.carousels || 106 },
                      { num: '7', title: '👀 7. Сторис', key: 'stories', desc: 'Готовые сторис для прогрева и публикаций', id: currentProject?.topics?.stories || 107 },
                      { num: '8', title: '📣 8. Публикации', key: 'publications', desc: 'Контент на публикацию, планировщик и буфер', id: currentProject?.topics?.publications || 108 },
                      { num: '9', title: '🎙️ Созвоны', key: 'calls', desc: 'Автоочистка чата, карточка созвона, ЛС напоминания за 1ч и 15м', id: currentProject?.topics?.calls || 109 }
                    ].map(top => (
                      <div key={top.num} className="p-2 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-between text-xs">
                        <div className="min-w-0 pr-2">
                          <div className="font-bold text-slate-800 flex items-center gap-1.5">
                            <span>{top.title}</span>
                          </div>
                          <div className="text-[10px] text-slate-500 truncate">{top.desc}</div>
                        </div>
                        <span className="font-mono text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded shrink-0">
                          #{top.id}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Setup Checklist */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                  <h4 className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">
                    Чек-лист подключения Telegram группы:
                  </h4>
                  <ul className="space-y-1.5 text-[11px] text-slate-600">
                    <li className="flex items-start gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>В группе включены <strong>Темы (Topics)</strong> в настройках Telegram.</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>Бот добавлен администратором с правами <strong>Управление темами</strong> (can_manage_topics).</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>Бот имеет право <strong>Удаление сообщений</strong> (can_delete_messages) для чистого создания созвонов.</span>
                    </li>
                  </ul>
                </div>
              </div>
            )}

            {activeSubTab === 'team' && (
              <div className="space-y-4">
                <div className="bg-indigo-50/70 border border-indigo-200 rounded-xl p-3 text-indigo-900 space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-xs">
                    <Shield className="w-4 h-4 text-indigo-700" />
                    Управление участниками и назначение ролей
                  </div>
                  <p className="text-[11px] text-indigo-800 leading-relaxed">
                    Продюсер может изменять роли для любого члена команды. Роль определяет доступные этапы конвейера и команды.
                  </p>
                </div>

                <div className="space-y-2.5">
                  {chatUsers.map(user => (
                    <div 
                      key={user.id}
                      className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
                          alt={user.name}
                          className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0"
                        />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900 text-xs">{user.name}</span>
                            <span className="text-[11px] font-mono text-indigo-600">{user.telegramUsername}</span>
                          </div>
                          <span className="text-[10px] text-slate-500">
                            {user.customTitle || 'Участник'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <select
                          value={user.role}
                          onChange={(e) => updateUserRole(user.id, e.target.value as UserRole)}
                          className="text-xs font-semibold px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer"
                        >
                          <option value="super_admin">Продюсер (Супер-админ)</option>
                          <option value="expert">Эксперт</option>
                          <option value="editor">Монтажёр</option>
                          <option value="designer">Дизайнер</option>
                          <option value="publisher">Публикатор / Ассистент</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeSubTab === 'schedule' && (
              <div className="space-y-4">
                <div className="bg-indigo-50/70 border border-indigo-200 rounded-xl p-3 text-indigo-900 space-y-1">
                  <div className="font-bold flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-indigo-600" />
                      Ритм рабочей недели и плановые слоты
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        setIsWeeklyPlannerOpen(true);
                      }}
                      className="px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Интерактивный мастер</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-indigo-700 leading-relaxed">
                    Дни съемок, монтажа и публикаций синхронизируются с календарным планом. Дни релизов строго зафиксированы: Вторник и Четверг.
                  </p>
                </div>

                {/* 1. Релизы (Фиксированные) */}
                <div className="p-3.5 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-emerald-950 flex items-center gap-1.5">
                      <span>Дни публикации в основную ленту</span>
                    </span>
                    <span className="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                      Фиксировано: Вт, Чт
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-800">
                    Согласно регламенту производства, релизы в основную ленту (Reels / Карусели) всегда выходят по вторникам и четвергам.
                  </p>
                </div>

                {/* 2. Дни съёмок */}
                <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                      <span>Дни съёмок эксперта</span>
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Выбрано: {weeklySchedule?.shootings?.length || 0} дн.
                    </span>
                  </div>
                  <div className="grid grid-cols-6 gap-1.5">
                    {ALL_WEEKDAYS.map(day => {
                      const active = weeklySchedule?.shootings?.includes(day.id);
                      return (
                        <button
                          key={day.id}
                          type="button"
                          onClick={() => {
                            const current = weeklySchedule?.shootings || [];
                            const next = active
                              ? current.filter(d => d !== day.id)
                              : [...current, day.id];
                            updateWeeklySchedule({ shootings: next });
                          }}
                          className={`py-2 text-center rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                            active
                              ? 'bg-rose-50 border-rose-300 text-rose-800 shadow-2xs'
                              : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                          }`}
                        >
                          {day.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Дни монтажа и дизайна */}
                <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                      <span>Дни сдачи монтажа и дизайна</span>
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Выбрано: {weeklySchedule?.editingDesign?.length || 0} дн.
                    </span>
                  </div>
                  <div className="grid grid-cols-6 gap-1.5">
                    {ALL_WEEKDAYS.map(day => {
                      const active = weeklySchedule?.editingDesign?.includes(day.id);
                      return (
                        <button
                          key={day.id}
                          type="button"
                          onClick={() => {
                            const current = weeklySchedule?.editingDesign || [];
                            const next = active
                              ? current.filter(d => d !== day.id)
                              : [...current, day.id];
                            updateWeeklySchedule({ editingDesign: next });
                          }}
                          className={`py-2 text-center rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                            active
                              ? 'bg-indigo-50 border-indigo-300 text-indigo-800 shadow-2xs'
                              : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                          }`}
                        >
                          {day.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 4. Тестовые дни (пробные публикации) */}
                <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                      <span>Дни публикации в пробные (тест 48ч)</span>
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Выбрано: {weeklySchedule?.trials?.length || 0} дн.
                    </span>
                  </div>
                  <div className="grid grid-cols-6 gap-1.5">
                    {ALL_WEEKDAYS.map(day => {
                      const active = weeklySchedule?.trials?.includes(day.id);
                      return (
                        <button
                          key={day.id}
                          type="button"
                          onClick={() => {
                            const current = weeklySchedule?.trials || [];
                            const next = active
                              ? current.filter(d => d !== day.id)
                              : [...current, day.id];
                            updateWeeklySchedule({ trials: next });
                          }}
                          className={`py-2 text-center rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                            active
                              ? 'bg-cyan-50 border-cyan-300 text-cyan-800 shadow-2xs'
                              : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                          }`}
                        >
                          {day.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {activeSubTab === 'system' && (
              <div className="space-y-4">
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-rose-900 space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-xs text-rose-800">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    Зона управления данными и очистки
                  </div>
                  <p className="text-[11px] text-rose-700 leading-relaxed">
                    Здесь супер-админ может полностью сбросить задачи, очистить банк идей для начала чистого цикла или восстановить демо-данные.
                  </p>
                </div>

                {resetSuccessMessage && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-150">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{resetSuccessMessage}</span>
                  </div>
                )}

                {/* Card 1: Clear all tasks */}
                <div className="p-4 bg-white border border-rose-200 rounded-xl shadow-2xs space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                        <Trash2 className="w-4 h-4 text-rose-600" />
                        <span>Полный сброс всех задач (очистить банк идей)</span>
                      </h4>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        Полностью удаляет ВСЕ карточки конвейера: идеи, сценарии, съемки и монтаж. Банк задач и конвейер станут совершенно пустыми.
                      </p>
                    </div>
                  </div>

                  {confirmResetTasks ? (
                    <div className="p-3 bg-rose-50 border border-rose-300 rounded-lg space-y-2.5">
                      <p className="text-xs font-bold text-rose-800 flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                        <span>Вы уверены? Это действие безвозвратно удалит все задачи!</span>
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            clearAllTasks();
                            setConfirmResetTasks(false);
                            setResetSuccessMessage('Все задачи конвейера успешно удалены. Банк идей пуст.');
                            setTimeout(() => setResetSuccessMessage(null), 3000);
                          }}
                          className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer shadow-2xs"
                        >
                          Да, полностью удалить ВСЕ задачи
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmResetTasks(false)}
                          className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-lg transition-colors cursor-pointer"
                        >
                          Отмена
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmResetTasks(true)}
                      className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                      <span>Сбросить все задачи конвейера</span>
                    </button>
                  )}
                </div>

                {/* Card 2: Restore Demo Data */}
                <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs space-y-3">
                  <div className="space-y-1">
                    <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                      <RotateCcw className="w-4 h-4 text-indigo-600" />
                      <span>Восстановить демо-данные</span>
                    </h4>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Сбрасывает задачи и созвоны к исходному демонстрационному состоянию с примерами карточек для тестов.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm('Восстановить стандартные демонстрационные задачи и созвоны?')) {
                        resetAllData();
                        setResetSuccessMessage('Демо-данные успешно загружены!');
                        setTimeout(() => setResetSuccessMessage(null), 3000);
                      }
                    }}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                    <span>Сбросить к исходным демо-данным</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Actions - Always visible, pinned at bottom */}
          <div className="p-3.5 sm:p-4 border-t border-slate-100 bg-slate-50/80 flex items-center justify-end gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 font-semibold hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Отмена
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
            >
              {saveSuccess ? (
                <>
                  <Check className="w-4 h-4 text-white" />
                  <span>Сохранено!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Сохранить настройки</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {isTeamModalOpen && (
        <TeamManagementModal
          isOpen={isTeamModalOpen}
          onClose={() => setIsTeamModalOpen(false)}
        />
      )}
    </div>,
    document.body
  );
};

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useProduction } from '../context/ProductionContext';
import { ProjectMember, TeamRole, TEAM_ROLES, WeekDayShort } from '../types';
import { 
  X, 
  Settings, 
  Sliders, 
  Users, 
  Check, 
  Save, 
  Film, 
  Layers, 
  Flame, 
  ShieldCheck, 
  Shield,
  Trash2,
  AlertTriangle,
  RotateCcw,
  Calendar,
  Sparkles,
  Plus,
  UserPlus
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'norms' | 'schedule' | 'team' | 'system' | 'project' | 'bot';
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
    clearAllTasks, 
    resetAllData, 
    weeklySchedule, 
    updateWeeklySchedule, 
    setIsWeeklyPlannerOpen, 
    projects, 
    currentProjectId,
    updateProjectMembers
  } = useProduction();

  const currentProject = projects.find(p => p.id === currentProjectId) || projects[0] || null;

  // Normalize initialTab, falling back from legacy 'project' or 'bot' to 'norms'
  const resolveTab = (tab?: string): 'norms' | 'schedule' | 'team' | 'system' => {
    if (tab === 'schedule' || tab === 'team' || tab === 'system') return tab;
    return 'norms';
  };

  const [activeSubTab, setActiveSubTab] = useState<'norms' | 'schedule' | 'team' | 'system'>(
    resolveTab(initialTab)
  );

  useEffect(() => {
    if (initialTab) {
      setActiveSubTab(resolveTab(initialTab));
    }
  }, [initialTab]);

  // Norms Form state
  const [reelsNorm, setReelsNorm] = useState(norms.monthPlanReels);
  const [carouselsNorm, setCarouselsNorm] = useState(norms.monthPlanCarousels);
  const [storiesNorm, setStoriesNorm] = useState(norms.monthPlanStories);
  const [bufferTarget, setBufferTarget] = useState(norms.bufferTarget);

  // Team members local state
  const [teamMembers, setTeamMembers] = useState<ProjectMember[]>(() => {
    return currentProject?.members && currentProject.members.length > 0 
      ? currentProject.members 
      : [];
  });

  useEffect(() => {
    if (currentProject?.members && currentProject.members.length > 0) {
      setTeamMembers(currentProject.members);
    }
  }, [currentProject?.members]);

  // System reset states
  const [confirmResetTasks, setConfirmResetTasks] = useState(false);
  const [resetSuccessMessage, setResetSuccessMessage] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [teamError, setTeamError] = useState<string | null>(null);

  if (!isOpen) return null;
  if (typeof document === 'undefined') return null;

  // Team Management Handlers
  const handleToggleMemberRole = (memberId: string, role: TeamRole) => {
    setTeamError(null);
    setTeamMembers(prev => prev.map(m => {
      if (m.id !== memberId) return m;
      const hasRole = m.roles.includes(role);
      const newRoles = hasRole 
        ? m.roles.filter(r => r !== role)
        : [...m.roles, role];
      return { ...m, roles: newRoles };
    }));
  };

  const handleUpdateMemberName = (id: string, name: string) => {
    setTeamMembers(prev => prev.map(m => m.id === id ? { ...m, name } : m));
  };

  const handleUpdateMemberUsername = (id: string, username: string) => {
    const formatted = username.startsWith('@') || !username ? username : `@${username}`;
    setTeamMembers(prev => prev.map(m => m.id === id ? { ...m, username: formatted } : m));
  };

  const handleAddMember = () => {
    setTeamMembers(prev => [
      ...prev,
      {
        id: `member-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name: '',
        username: '',
        roles: []
      }
    ]);
  };

  const handleRemoveMember = (id: string) => {
    if (teamMembers.length <= 1) {
      setTeamError('В проекте должен оставаться хотя бы один участник команды.');
      return;
    }
    setTeamMembers(prev => prev.filter(m => m.id !== id));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate team if on team tab or saving all
    for (const m of teamMembers) {
      if (!m.name.trim()) {
        setActiveSubTab('team');
        setTeamError('Укажите имя для каждого участника команды.');
        return;
      }
      if (m.roles.length === 0) {
        setActiveSubTab('team');
        setTeamError(`Выберите хотя бы одну роль для ${m.name}.`);
        return;
      }
    }

    // Save Norms
    updateNorms({
      monthPlanReels: Number(reelsNorm),
      monthPlanCarousels: Number(carouselsNorm),
      monthPlanStories: Number(storiesNorm),
      bufferTarget: Number(bufferTarget)
    });

    // Save Team
    if (currentProject) {
      updateProjectMembers(currentProject.id, teamMembers);
    }

    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 700);
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
              <p className="text-xs text-slate-500">
                {currentProject ? `Проект «${currentProject.title}»` : 'Нормативы, ритм недели и роли'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation - Sleek, strictly NO scrollbar, only 4 essential tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50/60 px-3 sm:px-5 pt-2 gap-1 sm:gap-2 text-xs font-semibold shrink-0 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <button
            type="button"
            onClick={() => setActiveSubTab('norms')}
            className={`pb-2 px-3 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeSubTab === 'norms'
                ? 'border-indigo-600 text-indigo-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Нормативы</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('schedule')}
            className={`pb-2 px-3 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
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
            className={`pb-2 px-3 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeSubTab === 'team'
                ? 'border-indigo-600 text-indigo-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Команда и роли</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('system')}
            className={`pb-2 px-3 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeSubTab === 'system'
                ? 'border-rose-600 text-rose-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-500" />
            <span>Сброс</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1 min-h-0 text-xs text-slate-700">
            
            {/* TAB 1: НОРМАТИВЫ И БУФЕР */}
            {activeSubTab === 'norms' && (
              <div className="space-y-4">
                <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3 text-amber-900 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-amber-700" />
                    Управление производственными нормативами
                  </div>
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    Настройте месячные планы раздельно для Reels, Каруселей и Stories, а также целевой буфер безопасности.
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

            {/* TAB 2: РИТМ НЕДЕЛИ */}
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
                    Дни съемок, монтажа и публикаций синхронизируются с календарным планом. Релизы в основную ленту фиксированы: Вторник и Четверг.
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

                {/* 4. Тестовые дни */}
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

            {/* TAB 3: КОМАНДА И РОЛИ (СИНХРОНИЗИРОВАНО С БАЗОЙ ТЕЛЕГРАМ) */}
            {activeSubTab === 'team' && (
              <div className="space-y-4">
                <div className="bg-indigo-50/70 border border-indigo-200 rounded-xl p-3 text-indigo-900 space-y-1">
                  <div className="font-bold flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5">
                      <Shield className="w-4 h-4 text-indigo-700" />
                      Команда проекта «{currentProject?.title || 'Проект'}»
                    </span>
                    <span className="text-[10px] font-mono text-indigo-600 bg-white/80 px-2 py-0.5 rounded border border-indigo-200">
                      Участников: {teamMembers.length}
                    </span>
                  </div>
                  <p className="text-[11px] text-indigo-800 leading-relaxed">
                    Назначьте роли для каждого члена команды. У одного участника может быть <strong>несколько ролей одновременно</strong> (права суммируются).
                  </p>
                </div>

                {teamError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{teamError}</span>
                  </div>
                )}

                {/* Team Members List */}
                <div className="space-y-3">
                  {teamMembers.map((member, index) => (
                    <div 
                      key={member.id}
                      className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-3"
                    >
                      {/* Member Info Row */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-0.5">
                              Имя / Никнейм
                            </label>
                            <input
                              type="text"
                              value={member.name}
                              onChange={(e) => handleUpdateMemberName(member.id, e.target.value)}
                              placeholder="Имя участника"
                              className="w-full px-2.5 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-0.5">
                              Telegram @username
                            </label>
                            <input
                              type="text"
                              value={member.username || ''}
                              onChange={(e) => handleUpdateMemberUsername(member.id, e.target.value)}
                              placeholder="@username"
                              className="w-full px-2.5 py-1.5 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                            />
                          </div>
                        </div>

                        {teamMembers.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveMember(member.id)}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer shrink-0 mt-3 sm:mt-0"
                            title="Удалить участника"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {/* 8 Multi-Select Roles */}
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center justify-between">
                          <span>Роли участника (нажмите для переключения):</span>
                          <span className="text-indigo-600 lowercase font-normal">
                            выбрано: {member.roles.length}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {TEAM_ROLES.map(role => {
                            const isSelected = member.roles.includes(role.id);
                            return (
                              <button
                                key={role.id}
                                type="button"
                                onClick={() => handleToggleMemberRole(member.id, role.id)}
                                className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                                  isSelected
                                    ? 'shadow-2xs ring-1 ring-black/10'
                                    : 'bg-slate-100 hover:bg-slate-200/80 text-slate-600 border border-slate-200/60'
                                }`}
                                style={
                                  isSelected
                                    ? {
                                        backgroundColor: role.bgLightColor,
                                        color: role.badgeColor,
                                      }
                                    : undefined
                                }
                              >
                                {isSelected && <Check className="w-3 h-3 shrink-0 stroke-[3]" />}
                                <span>{role.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add Member Button */}
                <button
                  type="button"
                  onClick={handleAddMember}
                  className="w-full py-2.5 border border-dashed border-indigo-300 hover:border-indigo-500 bg-indigo-50/40 hover:bg-indigo-50 text-indigo-700 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Добавить участника команды</span>
                </button>
              </div>
            )}

            {/* TAB 4: СБРОС И ОЧИСТКА */}
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
                  <div className="space-y-1">
                    <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                      <Trash2 className="w-4 h-4 text-rose-600" />
                      <span>Полный сброс всех задач (очистить банк идей)</span>
                    </h4>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Полностью удаляет ВСЕ карточки конвейера: идеи, сценарии, съемки и монтаж. Банк задач и конвейер станут совершенно пустыми.
                    </p>
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
    </div>,
    document.body
  );
};

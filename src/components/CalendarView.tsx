import React, { useState, useMemo } from 'react';
import { useProduction } from '../context/ProductionContext';
import { TaskCard, CallEvent, TagColor } from '../types';
import { TAG_DEFINITIONS } from '../constants/tags';
import { CreateTaskModal } from './CreateTaskModal';
import { generateWorkingCallLink } from '../utils/callLinkGenerator';
import { 
  formatDateToISO, 
  getWeekDays, 
  getMonthMatrix, 
  RUSSIAN_MONTHS, 
  RUSSIAN_MONTHS_GENITIVE,
  RUSSIAN_MONTHS_SHORT,
  RUSSIAN_WEEKDAYS_SHORT, 
  RUSSIAN_WEEKDAYS_FULL,
  formatRussianDate,
  parseISODate
} from '../utils/dateUtils';
import { 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Video, 
  X, 
  Plus, 
  ArrowUpRight,
  Trash2,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';

interface CalendarEventItem {
  id: string;
  type: 'task' | 'call' | 'shooting' | 'rest';
  title: string;
  time?: string;
  tag: TagColor;
  task?: TaskCard;
  call?: CallEvent;
}

interface CalendarViewProps {
  onNavigateToContent?: (taskId?: string) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ onNavigateToContent }) => {
  const { 
    tasks, 
    calls, 
    currentExpertId, 
    currentProjectId,
    currentProject,
    setSelectedTaskId, 
    activeRole, 
    createCall,
    deleteCall
  } = useProduction();

  const [callToDelete, setCallToDelete] = useState<CallEvent | null>(null);

  // Real-time actual date calculation
  const todayISO = useMemo(() => formatDateToISO(new Date()), []);

  const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false);
  const [isCreateCallModalOpen, setIsCreateCallModalOpen] = useState(false);
  const [callTitle, setCallTitle] = useState('');
  const [callDate, setCallDate] = useState(() => formatDateToISO(new Date()));
  const [callTime, setCallTime] = useState('15:00');
  const [callDuration, setCallDuration] = useState(45);

  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());
  const [selectedDayISO, setSelectedDayISO] = useState<string>(() => formatDateToISO(new Date()));

  const currentChatIdStr = currentProject ? String(currentProject.chatId) : '';
  // Active project / expert tasks and calls
  const expertTasks = useMemo(() => {
    return tasks.filter(t => {
      if (t.isArchived || t.rejected) return false;
      if (currentProjectId && (t.projectId === currentProjectId || t.projectId === currentChatIdStr)) {
        return true;
      }
      return !t.projectId || t.expertId === currentExpertId;
    });
  }, [tasks, currentProjectId, currentChatIdStr, currentExpertId]);

  const expertCalls = useMemo(() => {
    return calls.filter(c => {
      if (currentProjectId && ((c as any).projectId === currentProjectId || (c as any).projectId === currentChatIdStr)) {
        return true;
      }
      return !(c as any).projectId || c.expertId === currentExpertId;
    });
  }, [calls, currentProjectId, currentChatIdStr, currentExpertId]);

  // Navigate dates
  const handlePrev = () => {
    const next = new Date(currentDate);
    if (viewMode === 'week') {
      next.setDate(next.getDate() - 7);
      const currentSelected = parseISODate(selectedDayISO);
      currentSelected.setDate(currentSelected.getDate() - 7);
      setSelectedDayISO(formatDateToISO(currentSelected));
    } else {
      next.setMonth(next.getMonth() - 1);
      const currentSelected = parseISODate(selectedDayISO);
      const targetYear = next.getFullYear();
      const targetMonth = next.getMonth();
      const maxDaysInTarget = new Date(targetYear, targetMonth + 1, 0).getDate();
      const clampedDay = Math.min(currentSelected.getDate(), maxDaysInTarget);
      setSelectedDayISO(formatDateToISO(new Date(targetYear, targetMonth, clampedDay)));
    }
    setCurrentDate(next);
  };

  const handleNext = () => {
    const next = new Date(currentDate);
    if (viewMode === 'week') {
      next.setDate(next.getDate() + 7);
      const currentSelected = parseISODate(selectedDayISO);
      currentSelected.setDate(currentSelected.getDate() + 7);
      setSelectedDayISO(formatDateToISO(currentSelected));
    } else {
      next.setMonth(next.getMonth() + 1);
      const currentSelected = parseISODate(selectedDayISO);
      const targetYear = next.getFullYear();
      const targetMonth = next.getMonth();
      const maxDaysInTarget = new Date(targetYear, targetMonth + 1, 0).getDate();
      const clampedDay = Math.min(currentSelected.getDate(), maxDaysInTarget);
      setSelectedDayISO(formatDateToISO(new Date(targetYear, targetMonth, clampedDay)));
    }
    setCurrentDate(next);
  };

  const handleToday = () => {
    const now = new Date();
    setCurrentDate(now);
    setSelectedDayISO(formatDateToISO(now));
  };

  // Helper: Get events for a specific ISO date
  const getEventsForDate = (dateISO: string): CalendarEventItem[] => {
    const items: CalendarEventItem[] = [];

    // 1. Calls scheduled for this date
    const dayCalls = expertCalls.filter(c => c.date === dateISO);
    dayCalls.forEach(call => {
      items.push({
        id: `call-${call.id}`,
        type: 'call',
        title: call.title,
        time: call.time,
        tag: 'editing',
        call,
      });
    });

    // 2. Tasks with targetPublishDate or shootingDate matching
    expertTasks.forEach(task => {
      if (task.shootingDate && task.shootingDate.startsWith(dateISO)) {
        const timePart = task.shootingDate.split(' ')[1] || '14:00';
        items.push({
          id: `shoot-${task.id}`,
          type: 'shooting',
          title: `Съемка: ${task.title}`,
          time: timePart,
          tag: 'shooting',
          task,
        });
      }

      if (task.kind === 'non_content') {
        if (task.targetDueDate === dateISO) {
          items.push({
            id: `task-${task.id}`,
            type: 'task',
            title: task.title,
            time: 'Дедлайн',
            tag: 'idea',
            task,
          });
        }
        return;
      }

      const matchesDate = task.targetPublishDate === dateISO || (!task.targetPublishDate && task.targetDueDate === dateISO);
      if (matchesDate) {
        let tag: TagColor = 'reels';
        if (task.placement === 'trial') {
          tag = 'test';
        } else if (task.editingStatus === 'yellow' && task.type === 'reels') {
          tag = 'editing';
        } else if (task.editingStatus === 'yellow' && task.type !== 'reels') {
          tag = 'design';
        } else if (task.scriptStatus === 'gray') {
          tag = 'no_script';
        } else if (task.type === 'reels') {
          tag = 'reels';
        } else if (task.type === 'carousel') {
          tag = 'carousel';
        } else if (task.type === 'stories') {
          tag = 'stories';
        }

        items.push({
          id: `task-${task.id}`,
          type: 'task',
          title: task.title,
          time: task.targetDueDate === dateISO ? 'Дедлайн' : '12:00',
          tag,
          task,
        });
      }
    });

    return items;
  };

  const handleCreateCallSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!callTitle.trim()) return;

    createCall({
      title: callTitle.trim(),
      date: callDate,
      time: callTime,
      durationMinutes: Number(callDuration),
      participants: ['Кирилл (Продюсер)', 'Вера (Эксперт)'],
      link: generateWorkingCallLink('jitsi', callTitle.trim())
    });

    setIsCreateCallModalOpen(false);
    setCallTitle('');
  };

  // Week days calculation
  const weekDays = useMemo(() => getWeekDays(currentDate), [currentDate]);

  // Month matrix calculation
  const monthMatrix = useMemo(() => {
    return getMonthMatrix(currentDate.getFullYear(), currentDate.getMonth());
  }, [currentDate]);

  const monthTitle = `${RUSSIAN_MONTHS[currentDate.getMonth()]} ${currentDate.getFullYear()}`;

  // Check if viewing the active/current period
  const isCurrentPeriod = useMemo(() => {
    if (viewMode === 'week') {
      return weekDays.some(d => formatDateToISO(d) === todayISO);
    }
    const today = new Date();
    return currentDate.getFullYear() === today.getFullYear() && currentDate.getMonth() === today.getMonth();
  }, [viewMode, weekDays, todayISO, currentDate]);

  // Dynamic navigation label: displays 'Сегодня' on active period, or date range on other periods
  const navigationLabel = useMemo(() => {
    if (viewMode === 'week') {
      const isCurrentWeek = weekDays.some(d => formatDateToISO(d) === todayISO);
      if (isCurrentWeek) {
        return 'Сегодня';
      }
      const start = weekDays[0];
      const end = weekDays[6];
      if (start && end) {
        const startMonth = RUSSIAN_MONTHS_SHORT[start.getMonth()];
        const endMonth = RUSSIAN_MONTHS_SHORT[end.getMonth()];
        if (start.getMonth() === end.getMonth()) {
          return `${start.getDate()}–${end.getDate()} ${endMonth}`;
        }
        return `${start.getDate()} ${startMonth} – ${end.getDate()} ${endMonth}`;
      }
      const selDate = parseISODate(selectedDayISO);
      return `${selDate.getDate()} ${RUSSIAN_MONTHS_SHORT[selDate.getMonth()]}`;
    } else {
      // Month view
      const today = new Date();
      const isCurrentMonth = currentDate.getFullYear() === today.getFullYear() && currentDate.getMonth() === today.getMonth();
      if (isCurrentMonth) {
        return 'Этот месяц';
      }
      const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
      return `1–${lastDay} ${RUSSIAN_MONTHS_SHORT[currentDate.getMonth()]}`;
    }
  }, [viewMode, weekDays, selectedDayISO, currentDate, todayISO]);

  // Events for selected day
  const selectedDayEvents = selectedDayISO ? getEventsForDate(selectedDayISO) : [];
  
  // Format selected day title
  const selectedDayDateObj = parseISODate(selectedDayISO);
  const selectedDayWeekdayName = RUSSIAN_WEEKDAYS_FULL[selectedDayDateObj.getDay()];
  const selectedDayFormatted = `${selectedDayWeekdayName}, ${selectedDayDateObj.getDate()} ${RUSSIAN_MONTHS[selectedDayDateObj.getMonth()].toLowerCase()}`;

  return (
    <div className="space-y-4">
      {/* Calendar Control Bar */}
      <div className="bg-white rounded-[16px] p-3.5 space-y-2.5">
        {/* Row 1: Month and Year + View Switcher & Action */}
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-semibold text-black text-[17px] tracking-tight">
            {monthTitle}
          </h3>

          {/* View Switcher & Actions */}
          <div className="flex items-center gap-2">
            {activeRole === 'super_admin' && (
              <button
                type="button"
                onClick={() => setIsCreateCallModalOpen(true)}
                className="text-[13px] text-[#007AFF] font-medium flex items-center gap-1 cursor-pointer mr-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Созвон</span>
              </button>
            )}

            <div className="bg-[#767680]/12 p-0.5 rounded-[9px] flex items-center select-none">
              <button
                id="view-week-btn"
                type="button"
                onClick={() => setViewMode('week')}
                className={`px-3 py-1 text-[13px] font-medium rounded-[7px] transition-all cursor-pointer ${
                  viewMode === 'week'
                    ? 'bg-white text-black shadow-xs font-semibold'
                    : 'text-[#8E8E93] hover:text-black'
                }`}
              >
                Неделя
              </button>
              <button
                id="view-month-btn"
                type="button"
                onClick={() => setViewMode('month')}
                className={`px-3 py-1 text-[13px] font-medium rounded-[7px] transition-all cursor-pointer ${
                  viewMode === 'month'
                    ? 'bg-white text-black shadow-xs font-semibold'
                    : 'text-[#8E8E93] hover:text-black'
                }`}
              >
                Месяц
              </button>
            </div>
          </div>
        </div>

        {/* Row 2: Stretched full-width navigation label with arrows */}
        <div className="w-full flex items-center justify-between bg-[#767680]/12 p-1 rounded-[10px]">
          <button
            type="button"
            onClick={handlePrev}
            className="p-1.5 hover:bg-white rounded-[8px] text-black transition-colors cursor-pointer shrink-0"
            aria-label="Назад"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex-1 text-center text-[13px] font-semibold text-slate-800 tracking-tight select-none">
            {navigationLabel}
          </div>
          <button
            type="button"
            onClick={handleNext}
            className="p-1.5 hover:bg-white rounded-[8px] text-black transition-colors cursor-pointer shrink-0"
            aria-label="Вперед"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Return to active period button (shown only when navigated away) */}
        {!isCurrentPeriod && (
          <div className="flex justify-center pt-0.5">
            <button
              type="button"
              onClick={handleToday}
              className="text-[12px] font-semibold text-[#007AFF] hover:text-[#0051a8] hover:bg-[#007AFF]/10 px-3 py-1 rounded-[8px] transition-all cursor-pointer flex items-center gap-1.5 select-none"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Вернуться</span>
            </button>
          </div>
        )}
      </div>

      {/* 2.2 Horizontal Week Strip (Стрип недели: строго 7 равных колонок на 100% ширины) */}
      {viewMode === 'week' && (
        <div className="bg-white rounded-[16px] p-3 w-full">
          <div className="grid grid-cols-7 w-full text-center">
            {weekDays.map((day, idx) => {
              const dayISO = formatDateToISO(day);
              const isSelected = selectedDayISO === dayISO;
              const isToday = dayISO === todayISO;
              const dayEvents = getEventsForDate(dayISO);
              const weekdayShort = RUSSIAN_WEEKDAYS_SHORT[idx];
              const dayNum = day.getDate();

              return (
                <button
                  key={dayISO}
                  type="button"
                  onClick={() => setSelectedDayISO(dayISO)}
                  className="flex flex-col items-center justify-between py-1 rounded-[10px] hover:bg-[#767680]/5 transition-colors cursor-pointer group"
                >
                  {/* Top: Day of week */}
                  <span className="text-[11px] font-medium uppercase text-[#8E8E93] mb-1">
                    {weekdayShort}
                  </span>

                  {/* Middle: 32x32px interactive circle */}
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-[14px] transition-all ${
                      isSelected
                        ? 'bg-[#007AFF] text-white font-semibold shadow-xs'
                        : isToday
                        ? 'border border-[#007AFF] text-[#007AFF] font-semibold'
                        : 'text-black font-normal group-hover:text-[#007AFF]'
                    }`}
                  >
                    {dayNum}
                  </div>

                  {/* Bottom: 6px indicator dots */}
                  <div className="h-1.5 flex items-center justify-center gap-0.5 mt-1.5">
                    {dayEvents.slice(0, 3).map((ev, dotIdx) => {
                      const dotColor = TAG_DEFINITIONS[ev.tag]?.dotColor || '#007AFF';
                      return (
                        <span
                          key={dotIdx}
                          className="w-1 h-1 rounded-full shrink-0"
                          style={{ backgroundColor: isSelected ? '#007AFF' : dotColor }}
                        />
                      );
                    })}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Month View Matrix */}
      {viewMode === 'month' && (
        <div className="bg-white rounded-[16px] p-3 w-full overflow-hidden">
          <div className="grid grid-cols-7 text-center text-[11px] font-medium text-[#8E8E93] uppercase pb-2 border-b border-[#C6C6C8]/30">
            {RUSSIAN_WEEKDAYS_SHORT.map(wd => (
              <div key={wd}>{wd}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 auto-rows-fr pt-1">
            {monthMatrix.map(({ date, isCurrentMonth }, idx) => {
              const dateISO = formatDateToISO(date);
              const isSelected = selectedDayISO === dateISO;
              const isToday = dateISO === todayISO;
              const dayEvents = getEventsForDate(dateISO);

              return (
                <button
                  key={`${dateISO}-${idx}`}
                  type="button"
                  onClick={() => setSelectedDayISO(dateISO)}
                  className={`min-h-[52px] py-1 flex flex-col items-center justify-between rounded-[8px] transition-colors cursor-pointer ${
                    !isCurrentMonth ? 'opacity-30' : ''
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-[13px] transition-all ${
                      isSelected
                        ? 'bg-[#007AFF] text-white font-semibold'
                        : isToday
                        ? 'border border-[#007AFF] text-[#007AFF] font-semibold'
                        : 'text-black'
                    }`}
                  >
                    {date.getDate()}
                  </div>

                  <div className="h-1.5 flex items-center justify-center gap-0.5">
                    {dayEvents.slice(0, 3).map((ev, dotIdx) => (
                      <span
                        key={dotIdx}
                        className="w-1 h-1 rounded-full shrink-0"
                        style={{ backgroundColor: TAG_DEFINITIONS[ev.tag]?.dotColor || '#007AFF' }}
                      />
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 2.3 Selected Day Agenda (Область событий выбранного дня) */}
      <div className="bg-white rounded-[16px] p-4 space-y-3">
        {/* Section Header */}
        <div className="flex items-center justify-between border-b border-[#C6C6C8]/40 pb-2.5">
          <h4 className="text-[15px] font-semibold text-black tracking-tight">
            Расписание на {selectedDayFormatted}
          </h4>
          <span className="text-[12px] text-[#8E8E93]">
            {selectedDayEvents.length > 0 ? `${selectedDayEvents.length} соб.` : '0 соб.'}
          </span>
        </div>

        {/* Events List */}
        {selectedDayEvents.length === 0 ? (
          <div className="h-16 flex items-center justify-center text-[14px] text-[#8E8E93]">
            Событий нет
          </div>
        ) : (
          <div className="divide-y divide-[#C6C6C8]/40">
            {selectedDayEvents.map(ev => {
              const tagMeta = TAG_DEFINITIONS[ev.tag];
              const isTask = ev.type === 'task' || ev.type === 'shooting';

              return (
                <div
                  key={ev.id}
                  onClick={() => {
                    if (ev.task) {
                      setSelectedTaskId(ev.task.id);
                      onNavigateToContent?.(ev.task.id);
                    }
                  }}
                  className={`py-3 flex items-center justify-between gap-3 text-left transition-colors ${
                    isTask ? 'cursor-pointer hover:bg-[#767680]/5 rounded-[8px] px-2 -mx-2' : ''
                  }`}
                >
                  {/* Left: Time & Color Bar */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[13px] font-mono text-[#8E8E93] w-14 text-right">
                        {ev.time || '12:00'}
                      </span>
                      <div
                        className="w-1 h-8 rounded-full shrink-0"
                        style={{ backgroundColor: tagMeta?.dotColor || '#007AFF' }}
                      />
                    </div>

                    <div className="min-w-0 space-y-0.5">
                      <h5 className="text-[15px] font-semibold text-black truncate leading-snug">
                        {ev.title}
                      </h5>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-medium text-black bg-[#767680]/12 px-2 py-0.5 rounded-full">
                          {tagMeta?.label || 'Событие'}
                        </span>
                        {ev.call && (
                          <span className="text-[11px] text-[#8E8E93]">
                            {ev.call.durationMinutes} мин
                          </span>
                        )}
                        {ev.task && (
                          <span className="text-[11px] text-[#8E8E93]">
                            #{ev.task.id}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {ev.call && (
                      <a
                        href={ev.call.link}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="h-8 px-3 bg-[#007AFF] text-white text-[12px] font-semibold rounded-[8px] flex items-center gap-1 hover:bg-[#007AFF]/90 transition-colors"
                      >
                        <Video className="w-3.5 h-3.5" />
                        <span>Войти</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </a>
                    )}
                    {isTask && (
                      <button
                        type="button"
                        className="p-1.5 text-[#8E8E93] hover:text-[#007AFF] transition-colors"
                      >
                        <ArrowUpRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal: Добавить задачу */}
      {isCreateTaskModalOpen && (
        <CreateTaskModal
          isOpen={isCreateTaskModalOpen}
          onClose={() => setIsCreateTaskModalOpen(false)}
          defaultDate={selectedDayISO}
        />
      )}

      {/* Modal: Назначить созвон */}
      {isCreateCallModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-[20px] w-full max-w-md shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-black text-[16px]">Новая встреча</h4>
              <button
                type="button"
                onClick={() => setIsCreateCallModalOpen(false)}
                className="text-[#8E8E93] hover:text-black cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCallSubmit} className="space-y-3">
              <div>
                <input
                  type="text"
                  dir="ltr"
                  required
                  placeholder="Тема встречи"
                  value={callTitle}
                  onChange={(e) => setCallTitle(e.target.value)}
                  className="w-full px-3 py-2.5 text-[14px] bg-[#767680]/8 text-black rounded-[10px] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  dir="ltr"
                  required
                  value={callDate}
                  onChange={(e) => setCallDate(e.target.value)}
                  className="px-3 py-2 text-[13px] bg-[#767680]/8 text-black rounded-[10px] focus:outline-none"
                />
                <input
                  type="time"
                  dir="ltr"
                  required
                  value={callTime}
                  onChange={(e) => setCallTime(e.target.value)}
                  className="px-3 py-2 text-[13px] bg-[#767680]/8 text-black rounded-[10px] focus:outline-none"
                />
              </div>

              <div>
                <select
                  value={callDuration}
                  onChange={(e) => setCallDuration(Number(e.target.value))}
                  className="w-full px-3 py-2 text-[13px] bg-[#767680]/8 text-black rounded-[10px] focus:outline-none"
                >
                  <option value={30}>30 минут</option>
                  <option value={45}>45 минут</option>
                  <option value={60}>1 час</option>
                  <option value={90}>1.5 часа</option>
                </select>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateCallModalOpen(false)}
                  className="flex-1 h-11 bg-[#767680]/12 text-[#007AFF] font-semibold text-[15px] rounded-[12px] cursor-pointer"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="flex-1 h-11 bg-[#007AFF] text-white font-semibold text-[15px] rounded-[12px] cursor-pointer"
                >
                  Запланировать
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Подтверждение удаления созвона */}
      {callToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-[20px] w-full max-w-sm shadow-2xl p-5 space-y-3">
            <h4 className="font-semibold text-black text-[16px]">Удалить встречу?</h4>
            <p className="text-[13px] text-[#8E8E93]">
              «{callToDelete.title}» ({callToDelete.date} в {callToDelete.time})
            </p>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCallToDelete(null)}
                className="flex-1 h-11 bg-[#767680]/12 text-[#007AFF] font-semibold text-[15px] rounded-[12px] cursor-pointer"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteCall(callToDelete.id);
                  setCallToDelete(null);
                }}
                className="flex-1 h-11 bg-[#FF3B30] text-white font-semibold text-[15px] rounded-[12px] cursor-pointer"
              >
                Удалить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

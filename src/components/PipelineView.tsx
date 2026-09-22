import React, { useState, useMemo } from 'react';
import { useProduction } from '../context/ProductionContext';
import { TaskCard, ContentType } from '../types';
import { 
  Film, 
  Lightbulb, 
  FileText, 
  Camera, 
  Settings, 
  CheckCircle2, 
  Plus, 
  Mic, 
  Video, 
  Paperclip, 
  Send, 
  Clock, 
  Edit3, 
  FolderPlus, 
  ChevronRight, 
  ArrowRight,
  HelpCircle,
  X,
  Image as ImageIcon,
  Calendar,
  Ban,
  RotateCcw,
  Sparkles
} from 'lucide-react';

export type KanbanColumnId = 'idea' | 'script' | 'shooting' | 'development' | 'delivered';

interface KanbanColumnConfig {
  id: KanbanColumnId;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  badgeBg: string;
  borderColor: string;
  headerBg: string;
  description: string;
}

const KANBAN_COLUMNS: KanbanColumnConfig[] = [
  {
    id: 'idea',
    title: 'Идея',
    icon: Lightbulb,
    color: 'text-amber-600',
    badgeBg: 'bg-amber-100 text-amber-800',
    borderColor: 'border-amber-200',
    headerBg: 'bg-amber-50/80',
    description: 'Бэклог тем и входящие мысли',
  },
  {
    id: 'script',
    title: 'Сценарий',
    icon: FileText,
    color: 'text-blue-600',
    badgeBg: 'bg-blue-100 text-blue-800',
    borderColor: 'border-blue-200',
    headerBg: 'bg-blue-50/80',
    description: 'Написание и утверждение текста',
  },
  {
    id: 'shooting',
    title: 'На съёмке',
    icon: Camera,
    color: 'text-indigo-600',
    badgeBg: 'bg-indigo-100 text-indigo-800',
    borderColor: 'border-indigo-200',
    headerBg: 'bg-indigo-50/80',
    description: 'Слот зафиксирован, сбор дублей',
  },
  {
    id: 'development',
    title: 'В разработке',
    icon: Settings,
    color: 'text-purple-600',
    badgeBg: 'bg-purple-100 text-purple-800',
    borderColor: 'border-purple-200',
    headerBg: 'bg-purple-50/80',
    description: 'Монтаж видео / дизайн слайдов',
  },
  {
    id: 'delivered',
    title: 'Сдан',
    icon: CheckCircle2,
    color: 'text-emerald-600',
    badgeBg: 'bg-emerald-100 text-emerald-800',
    borderColor: 'border-emerald-200',
    headerBg: 'bg-emerald-50/80',
    description: 'Рендер принят / готов к публикации',
  },
];

export const PipelineView: React.FC = () => {
  const { 
    tasks, 
    currentRole, 
    activeRole,
    currentExpertId,
    currentProjectId,
    currentProject, 
    setSelectedTaskId, 
    setEditingScriptTaskId,
    updateTaskDetails,
    approveScript,
    addFootagePool,
    appendIdeaSupplement,
    attachRenderFromChat,
    attachCover,
    setPublicationSchedule,
    rejectTask,
    restoreTask,
    moveTaskToStage
  } = useProduction();

  // Active view column for mobile tabs (or 'all' for full kanban)
  const [activeMobileColumn, setActiveMobileColumn] = useState<KanbanColumnId | 'all'>('all');
  const [formatFilter, setFormatFilter] = useState<'all' | ContentType>('all');
  const [showRejected, setShowRejected] = useState(false);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  // Modals state
  const [renderModalTaskId, setRenderModalTaskId] = useState<string | null>(null);
  const [renderUrlInput, setRenderUrlInput] = useState('');
  const [renderNoteInput, setRenderNoteInput] = useState('Черновой монтаж v1 с субтитрами');

  // Cover Modal
  const [coverModalTaskId, setCoverModalTaskId] = useState<string | null>(null);
  const [coverUrlInput, setCoverUrlInput] = useState('');
  const [coverNoteInput, setCoverNoteInput] = useState('Обложка с крупным хуком для ленты');

  // Publication Modal
  const [pubModalTaskId, setPubModalTaskId] = useState<string | null>(null);
  const [trialDateInput, setTrialDateInput] = useState('');
  const [publishDateInput, setPublishDateInput] = useState('');

  // Reject Modal
  const [rejectModalTaskId, setRejectModalTaskId] = useState<string | null>(null);
  const [rejectStage, setRejectStage] = useState<'idea' | 'script' | 'video' | 'editing' | 'delivered'>('idea');
  const [rejectReason, setRejectReason] = useState('');

  // Supplement & Pool Modals
  const [supplementModalTaskId, setSupplementModalTaskId] = useState<string | null>(null);
  const [supplementType, setSupplementType] = useState<'voice' | 'video' | 'text'>('voice');
  const [supplementNote, setSupplementNote] = useState('');

  const [poolModalTaskId, setPoolModalTaskId] = useState<string | null>(null);
  const [poolFilesCount, setPoolFilesCount] = useState(4);
  const [poolNote, setPoolNote] = useState('');

  // Map task to Kanban Column
  const getTaskStage = (task: TaskCard): KanbanColumnId => {
    if (task.editingStatus === 'green') return 'delivered';
    if (task.editingStatus === 'yellow' || (task.shootingStatus === 'green' && task.type === 'reels')) return 'development';
    if (task.shootingStatus === 'yellow' || (task.scriptStatus === 'green' && task.type === 'reels')) return 'shooting';
    if (task.scriptStatus === 'yellow' || (task.scriptStatus === 'green' && task.type !== 'reels')) return 'script';
    return 'idea';
  };

  // Drag & Drop handlers
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId);
    setDraggedTaskId(taskId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDropOnColumn = (e: React.DragEvent, targetCol: KanbanColumnId) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;
    if (taskId) {
      const stageMap: Record<KanbanColumnId, 'idea' | 'script' | 'shooting' | 'editing' | 'delivered'> = {
        idea: 'idea',
        script: 'script',
        shooting: 'shooting',
        development: 'editing',
        delivered: 'delivered'
      };
      moveTaskToStage(taskId, stageMap[targetCol]);
    }
    setDraggedTaskId(null);
  };

  // Role based filtering
  const isEditor = activeRole === 'editor';
  const isDesigner = activeRole === 'designer';

  // Visible Kanban Columns based on role
  const visibleKanbanColumns = useMemo(() => {
    if (isEditor || isDesigner) {
      return KANBAN_COLUMNS.filter(col => col.id === 'development' || col.id === 'delivered');
    }
    return KANBAN_COLUMNS;
  }, [isEditor, isDesigner]);

  const currentChatIdStr = currentProject ? String(currentProject.chatId) : '';
  // Filter tasks
  const expertTasks = useMemo(() => {
    return tasks.filter(t => {
      if (t.isArchived || t.kind === 'non_content') return false;
      if (currentProjectId && t.projectId && t.projectId !== currentProjectId && t.projectId !== currentChatIdStr) {
        return false;
      }
      if (!currentProjectId && t.expertId !== currentExpertId) return false;
      if (t.type !== 'reels' && t.type !== 'carousel' && t.type !== 'stories') return false;
      // Editor only sees Reels
      if (isEditor && t.type !== 'reels') return false;
      // Designer only sees Carousels and Stories
      if (isDesigner && t.type !== 'carousel' && t.type !== 'stories') return false;
      return true;
    });
  }, [tasks, currentProjectId, currentChatIdStr, currentExpertId, isEditor, isDesigner]);

  const visibleTasks = useMemo(() => {
    return expertTasks.filter(task => {
      if (formatFilter !== 'all' && task.type !== formatFilter) return false;
      if (!showRejected && task.rejected) return false;
      return true;
    });
  }, [expertTasks, formatFilter, showRejected]);

  // Detailed stages display for card with gray/yellow/green color logic
  const renderCardStages = (task: TaskCard) => {
    const formatDate = (d?: string) => {
      if (!d) return null;
      try {
        const date = new Date(d);
        if (isNaN(date.getTime())) return d;
        return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
      } catch {
        return d;
      }
    };

    const getStageItem = (
      label: string, 
      value: string, 
      status: 'gray' | 'yellow' | 'green',
      extraControl?: React.ReactNode
    ) => {
      // Rule: "Дата в карточке всегда помечается жёлтым"
      const isDateValue = !!value && (
        /\d{1,2}\s+(янв|фев|мар|апр|май|июн|июл|авг|сен|окт|ноя|дек|\.)/i.test(value) || 
        /\d{4}-\d{2}-\d{2}/.test(value) || 
        /\d{2}\.\d{2}/.test(value)
      );
      const effectiveStatus = isDateValue ? 'yellow' : status;
      const statusClasses = {
        gray: 'text-slate-500 bg-slate-100/90 border-slate-200',
        yellow: 'text-amber-900 bg-amber-100 border-amber-300 font-bold',
        green: 'text-emerald-800 bg-emerald-50 border-emerald-200 font-semibold',
      }[effectiveStatus];

      return (
        <div key={label} className="flex items-center justify-between text-[10px] py-0.5 px-1 rounded hover:bg-slate-100/60 transition-colors">
          <div className="flex items-center gap-1 min-w-0">
            {extraControl}
            <span className="text-slate-500 font-normal">{label}:</span>
          </div>
          <span className={`px-1.5 py-0.2 rounded text-[10px] border ${statusClasses} shrink-0`}>
            {value}
          </span>
        </div>
      );
    };

    if (task.type === 'reels') {
      // 1. сценарий: (нет / черновик / утвержден)
      const scriptVal = task.scriptStatus === 'green' ? 'утвержден' : task.scriptStatus === 'yellow' ? 'черновик' : 'нет';
      const scriptColor = task.scriptStatus === 'green' ? 'green' : task.scriptStatus === 'yellow' ? 'yellow' : 'gray';

      // 2. съёмки: (нет / [дата] желтый / снято зеленый) + галочка напротив съёмки
      const shootingDateFormatted = formatDate(task.shootingDate);
      const isShootingDone = task.shootingStatus === 'green';
      const shootingVal = isShootingDone ? 'снято' : (shootingDateFormatted || 'нет');
      const shootingColor: 'green' | 'yellow' | 'gray' = isShootingDone ? 'green' : (shootingDateFormatted ? 'yellow' : 'gray');

      const shootingCheckbox = (
        <input
          type="checkbox"
          checked={isShootingDone}
          onChange={(e) => {
            e.stopPropagation();
            const checked = e.target.checked;
            updateTaskDetails(task.id, {
              shootingStatus: checked ? 'green' : (task.shootingDate ? 'yellow' : 'gray')
            });
          }}
          className="w-3 h-3 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
          title="Поставить галочку напротив съёмки"
        />
      );

      // 3. монтаж: (нет / [дата] желтый / сдан зеленый)
      const editingDateFormatted = formatDate(task.renderDeliveredAt || task.targetPublishDate);
      const isEditingDone = !!task.renderUrl || task.editingStatus === 'green';
      const editingVal = isEditingDone ? 'сдан' : (editingDateFormatted || (task.editingStatus === 'yellow' ? 'в процессе' : 'нет'));
      const editingColor: 'green' | 'yellow' | 'gray' = isEditingDone ? 'green' : (editingDateFormatted || task.editingStatus === 'yellow' ? 'yellow' : 'gray');

      // 4. материалы: (нет / есть)
      const materialsVal = task.materialsTotalCount > 0 ? 'есть' : 'нет';
      const materialsColor = task.materialsTotalCount > 0 ? 'green' : 'gray';

      // 5. пробные: (нет / [дата] желтый)
      const trialDateFormatted = formatDate(task.trialStartDate);
      const trialVal = trialDateFormatted || (task.placement === 'trial' ? 'на тесте' : 'нет');
      const trialColor: 'green' | 'yellow' | 'gray' = trialDateFormatted ? 'yellow' : (task.placement === 'trial' ? 'green' : 'gray');

      // 6. публикация: (нет / [дата] желтый)
      const pubDateFormatted = formatDate(task.finalPublishDate);
      const pubVal = pubDateFormatted || (task.placement === 'main_feed' ? 'опубликован' : 'нет');
      const pubColor: 'green' | 'yellow' | 'gray' = pubDateFormatted ? 'yellow' : (task.placement === 'main_feed' ? 'green' : 'gray');

      return (
        <div className="space-y-0.5 bg-slate-50/80 p-2 rounded-lg border border-slate-200/90 my-1">
          {getStageItem('сценарий', scriptVal, scriptColor)}
          {getStageItem('съёмки', shootingVal, shootingColor, shootingCheckbox)}
          {getStageItem('монтаж', editingVal, editingColor)}
          {getStageItem('материалы', materialsVal, materialsColor)}
          {getStageItem('пробные', trialVal, trialColor)}
          {getStageItem('публикация', pubVal, pubColor)}
        </div>
      );
    } else {
      // КАРУСЕЛИ И СТОРИС:
      // 1. сценарий: (нет / черновик (желтый) / утвержден (галочка))
      const scriptVal = task.scriptStatus === 'green' ? 'утвержден' : task.scriptStatus === 'yellow' ? 'черновик' : 'нет';
      const scriptColor = task.scriptStatus === 'green' ? 'green' : task.scriptStatus === 'yellow' ? 'yellow' : 'gray';

      // 2. дизайн: (нет / [дата] желтый / готов зеленый)
      const designDateFormatted = formatDate(task.renderDeliveredAt || task.targetPublishDate);
      const isDesignDone = !!task.renderUrl || task.editingStatus === 'green';
      const designVal = isDesignDone ? 'готов' : (designDateFormatted || (task.editingStatus === 'yellow' ? 'в процессе' : 'нет'));
      const designColor: 'green' | 'yellow' | 'gray' = isDesignDone ? 'green' : (designDateFormatted || task.editingStatus === 'yellow' ? 'yellow' : 'gray');

      // 3. публикация: (нет / [дата] желтый)
      const pubDateFormatted = formatDate(task.finalPublishDate);
      const pubVal = pubDateFormatted || (task.placement === 'main_feed' ? 'опубликован' : 'нет');
      const pubColor: 'green' | 'yellow' | 'gray' = pubDateFormatted ? 'yellow' : (task.placement === 'main_feed' ? 'green' : 'gray');

      return (
        <div className="space-y-0.5 bg-slate-50/80 p-2 rounded-lg border border-slate-200/90 my-1">
          {getStageItem('сценарий', scriptVal, scriptColor)}
          {getStageItem('дизайн', designVal, designColor)}
          {getStageItem('публикация', pubVal, pubColor)}
        </div>
      );
    }
  };

  // Group by Kanban stage
  const columnsData = useMemo(() => {
    const map: Record<KanbanColumnId, TaskCard[]> = {
      idea: [],
      script: [],
      shooting: [],
      development: [],
      delivered: [],
    };

    visibleTasks.forEach(task => {
      const stage = getTaskStage(task);
      map[stage].push(task);
    });

    return map;
  }, [visibleTasks]);

  const rejectedCount = useMemo(() => {
    return expertTasks.filter(t => t.rejected).length;
  }, [expertTasks]);

  // Submit Render handler
  const handleAttachRenderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!renderModalTaskId) return;
    attachRenderFromChat(
      renderModalTaskId,
      renderUrlInput || 'https://assets.mixkit.co/videos/preview/mixkit-girl-talking-to-camera-in-a-studio-setting-42289-large.mp4',
      undefined,
      renderNoteInput
    );
    setRenderModalTaskId(null);
    setRenderUrlInput('');
    setRenderNoteInput('Черновой монтаж v1 с субтитрами');
  };

  // Submit Cover handler
  const handleAttachCoverSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!coverModalTaskId) return;
    attachCover(
      coverModalTaskId,
      coverUrlInput || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
      coverNoteInput
    );
    setCoverModalTaskId(null);
    setCoverUrlInput('');
    setCoverNoteInput('Обложка с крупным хуком для ленты');
  };

  // Submit Publication Schedule handler
  const handlePublicationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pubModalTaskId) return;
    setPublicationSchedule(pubModalTaskId, trialDateInput, publishDateInput);
    setPubModalTaskId(null);
    setTrialDateInput('');
    setPublishDateInput('');
  };

  // Submit Reject handler
  const handleRejectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectModalTaskId || !rejectReason.trim()) return;
    rejectTask(rejectModalTaskId, rejectStage, rejectReason.trim());
    setRejectModalTaskId(null);
    setRejectReason('');
  };

  // Submit Idea Supplement handler
  const handleAppendSupplementSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplementModalTaskId || !supplementNote.trim()) return;
    appendIdeaSupplement(supplementModalTaskId, {
      type: supplementType,
      note: supplementNote.trim(),
    });
    setSupplementModalTaskId(null);
    setSupplementNote('');
  };

  // Submit Footage Pool handler
  const handleAddPoolSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!poolModalTaskId) return;
    addFootagePool(poolModalTaskId, Number(poolFilesCount), poolNote);
    setPoolModalTaskId(null);
    setPoolNote('');
  };

  // Open Publication modal with existing dates
  const openPubModal = (task: TaskCard) => {
    setPubModalTaskId(task.id);
    setTrialDateInput(task.trialStartDate || new Date().toISOString().slice(0, 16));
    const inTwoDays = new Date(Date.now() + 48 * 3600 * 1000).toISOString().slice(0, 16);
    setPublishDateInput(task.finalPublishDate || inTwoDays);
  };

  // Open Reject modal with default stage
  const openRejectModal = (task: TaskCard, currentCol: KanbanColumnId) => {
    setRejectModalTaskId(task.id);
    const stageMap: Record<KanbanColumnId, 'idea' | 'script' | 'video' | 'editing' | 'delivered'> = {
      idea: 'idea',
      script: 'script',
      shooting: 'video',
      development: 'editing',
      delivered: 'delivered'
    };
    setRejectStage(stageMap[currentCol]);
    setRejectReason('');
  };

  const rejectStagePresets: Record<string, string[]> = {
    idea: ['Неактуальная тема', 'Слабый хук / инсайт', 'Дублирует снятый контент', 'Не подходит эксперту по ToV'],
    script: ['Слабая завязка (первые 3 сек)', 'Слишком затянуто / нет динамики', 'Ошибки в фактуре', 'Сложный слог для озвучки'],
    video: ['Брак по звуку (шум/клиппинг)', 'Плохой свет / расфокус', 'Неуверенная подача / сбивчиво', 'Нужна полная пересъемка'],
    editing: ['Ошибки в субтитрах', 'Слабая графика / не тот стиль', 'Музыка перекрывает голос', 'Снять с монтажа'],
    delivered: ['Не прошел финальный отсмотр', 'Инфоповод устарел', 'Продюсер снял с публикации']
  };

  return (
    <div className="space-y-4">
      {/* Top Banner: Overview & Fast Filters (Mobile-friendly) */}
      <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200/90 p-3.5 sm:p-4 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <Film className="w-5 h-5 text-indigo-600 shrink-0" />
            <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              Конвейер производства
            </h2>
          </div>

          {/* Rejection count toggle */}
          {rejectedCount > 0 && (
            <button
              onClick={() => setShowRejected(!showRejected)}
              className={`text-xs px-2.5 py-1 rounded-lg border font-semibold flex items-center gap-1.5 transition-colors self-start sm:self-auto ${
                showRejected 
                  ? 'bg-rose-50 border-rose-300 text-rose-800' 
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Ban className="w-3.5 h-3.5 text-rose-600" />
              <span>{showRejected ? 'Скрыть забракованные' : `Забракованные (${rejectedCount})`}</span>
            </button>
          )}
        </div>

        {/* Filter Toolbar: Formats */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
          {isEditor ? (
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-medium">Роль:</span>
              <span className="px-2.5 py-1 rounded-md font-bold bg-purple-100 text-purple-800 border border-purple-200">
                Монтажёр (только Reels в разработке и сданные)
              </span>
            </div>
          ) : isDesigner ? (
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-medium">Роль:</span>
              <span className="px-2.5 py-1 rounded-md font-bold bg-blue-100 text-blue-800 border border-blue-200">
                Дизайнер (только Карусели и Stories)
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setFormatFilter('all')}
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all ${
                    formatFilter === 'all' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  Все
                </button>
                <button
                  onClick={() => setFormatFilter('carousel')}
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all ${
                    formatFilter === 'carousel' ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-700'
                  }`}
                >
                  Карусели
                </button>
                <button
                  onClick={() => setFormatFilter('stories')}
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all ${
                    formatFilter === 'stories' ? 'bg-orange-600 text-white' : 'bg-orange-50 text-orange-700'
                  }`}
                >
                  Stories
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
              <span className="text-slate-400 font-medium mr-1 hidden sm:inline">Формат:</span>
              <button
                onClick={() => setFormatFilter('all')}
                className={`px-2.5 py-1 rounded-md font-semibold transition-all shrink-0 ${
                  formatFilter === 'all' 
                    ? 'bg-slate-900 text-white shadow-2xs' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Все ({expertTasks.length})
              </button>
              <button
                onClick={() => setFormatFilter('reels')}
                className={`px-2.5 py-1 rounded-md font-semibold transition-all shrink-0 ${
                  formatFilter === 'reels' 
                    ? 'bg-purple-600 text-white shadow-2xs' 
                    : 'bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100'
                }`}
              >
                Reels ({expertTasks.filter(t => t.type === 'reels').length})
              </button>
              <button
                onClick={() => setFormatFilter('carousel')}
                className={`px-2.5 py-1 rounded-md font-semibold transition-all shrink-0 ${
                  formatFilter === 'carousel' 
                    ? 'bg-blue-600 text-white shadow-2xs' 
                    : 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100'
                }`}
              >
                Карусели ({expertTasks.filter(t => t.type === 'carousel').length})
              </button>
              <button
                onClick={() => setFormatFilter('stories')}
                className={`px-2.5 py-1 rounded-md font-semibold transition-all shrink-0 ${
                  formatFilter === 'stories' 
                    ? 'bg-orange-600 text-white shadow-2xs' 
                    : 'bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100'
                }`}
              >
                Stories ({expertTasks.filter(t => t.type === 'stories').length})
              </button>
            </div>
          )}
        </div>

        {/* Mobile Column Tabs (Scrollable for small screens) */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pt-2 border-t border-slate-100 lg:hidden">
          <button
            onClick={() => setActiveMobileColumn('all')}
            className={`px-2.5 py-1 text-xs rounded-lg font-bold shrink-0 transition-colors ${
              activeMobileColumn === 'all'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Все колонки
          </button>
          {visibleKanbanColumns.map(col => {
            const count = columnsData[col.id].length;
            const Icon = col.icon;
            return (
              <button
                key={col.id}
                onClick={() => setActiveMobileColumn(col.id)}
                className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg font-semibold shrink-0 transition-colors ${
                  activeMobileColumn === col.id
                    ? `${col.badgeBg} shadow-2xs font-bold ring-1 ring-black/10`
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{col.title}</span>
                <span className="text-[10px] opacity-80">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Kanban Grid */}
      <div className={`grid gap-3.5 items-start ${
        visibleKanbanColumns.length === 2 
          ? 'grid-cols-1 md:grid-cols-2 max-w-5xl mx-auto' 
          : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-5'
      }`}>
        {visibleKanbanColumns.map(col => {
          // On mobile, if specific column selected, hide other columns
          if (activeMobileColumn !== 'all' && activeMobileColumn !== col.id) {
            return null;
          }

          const colTasks = columnsData[col.id];
          const Icon = col.icon;

          return (
            <div
              key={col.id}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDropOnColumn(e, col.id)}
              className={`rounded-xl sm:rounded-2xl border ${col.borderColor} bg-slate-50/50 p-2.5 sm:p-3 flex flex-col min-h-[500px] transition-all`}
            >
              {/* Column Header */}
              <div className={`p-2.5 rounded-xl ${col.headerBg} border ${col.borderColor} mb-3 flex items-center justify-between`}>
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg bg-white shadow-2xs ${col.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xs sm:text-sm text-slate-900 flex items-center gap-1.5">
                      <span>{col.title}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${col.badgeBg}`}>
                        {colTasks.length}
                      </span>
                    </h3>
                    <p className="text-[10px] text-slate-500 line-clamp-1">
                      {col.description}
                    </p>
                  </div>
                </div>

                {col.id === 'idea' && !isEditor && !isDesigner && (
                  <button
                    onClick={() => {
                      const newTitle = prompt('Введите краткую тему новой идеи:');
                      if (newTitle) {
                        setSelectedTaskId(null);
                      }
                    }}
                    className="p-1 rounded-md text-amber-700 hover:bg-amber-100 transition-colors cursor-pointer"
                    title="Новая идея"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Task Cards Stack */}
              <div className="flex-1 space-y-3 overflow-y-auto max-h-[calc(100vh-260px)] pr-0.5">
                {colTasks.length === 0 ? (
                  <div className="py-8 px-4 text-center rounded-xl bg-white/70 border border-dashed border-slate-200 text-xs text-slate-400">
                    Перетащите задачу сюда
                  </div>
                ) : (
                  colTasks.map(task => {
                    const isReels = task.type === 'reels';
                    const telegramLink = task.pools[0]?.telegramChatLink || task.supplements?.[0]?.telegramLink || 'https://t.me';

                    return (
                      <div
                        key={task.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, task.id)}
                        className={`bg-white rounded-xl border p-3 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between space-y-2 relative group cursor-grab active:cursor-grabbing ${
                          task.rejected ? 'border-amber-300 bg-amber-50/20' : 'border-slate-200/90'
                        }`}
                      >
                        {/* Rejected Banner if applicable (no red) */}
                        {task.rejected && (
                          <div className="p-2 bg-slate-100 border border-slate-300 rounded-lg text-slate-800 text-[11px] flex items-center justify-between gap-1">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <Ban className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                              <span className="truncate font-medium">Брак: {task.rejectedReason}</span>
                            </div>
                            <button
                              onClick={() => restoreTask(task.id)}
                              className="text-indigo-600 hover:text-indigo-800 font-bold shrink-0 flex items-center gap-0.5 cursor-pointer"
                              title="Восстановить в конвейер"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>Вернуть</span>
                            </button>
                          </div>
                        )}

                        {/* Top: #ID + Format Badge + Clickable Title */}
                        <div>
                          <div className="flex items-center justify-between gap-1.5 mb-1.5">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-xs font-bold bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded border border-slate-300">
                                #{task.id}
                              </span>
                              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                                isReels
                                  ? 'bg-purple-50 text-purple-700 border-purple-200'
                                  : task.type === 'carousel'
                                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                                  : 'bg-orange-50 text-orange-700 border-orange-200'
                              }`}>
                                {task.type === 'reels' ? 'Reels' : task.type === 'carousel' ? 'Карусель' : 'Stories'}
                              </span>
                            </div>

                            {/* Optional subtle reject button for supervisors only */}
                            {(activeRole === 'super_admin' || activeRole === 'publisher') && !task.rejected && (
                              <button
                                onClick={() => openRejectModal(task, col.id)}
                                className="text-slate-400 hover:text-slate-700 p-0.5 rounded transition-colors text-[10px] flex items-center gap-0.5"
                                title="Забраковать задачу"
                              >
                                <Ban className="w-3 h-3" />
                              </button>
                            )}
                          </div>

                          {/* Title */}
                          <h4 
                            onClick={() => setSelectedTaskId(task.id)}
                            className="text-xs sm:text-sm font-bold text-slate-900 hover:text-indigo-600 cursor-pointer line-clamp-2 leading-snug"
                          >
                            {task.title}
                          </h4>
                        </div>

                        {/* Stages list block with clean color logic (Gray / Yellow / Green) */}
                        {renderCardStages(task)}

                        {/* Action buttons tailored to requirements */}
                        <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-1.5 items-center justify-between">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {/* Main Details Button */}
                            <button
                              onClick={() => setSelectedTaskId(task.id)}
                              className="py-1 px-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                              title="Открыть карточку задачи"
                            >
                              <FileText className="w-3 h-3 text-slate-500" />
                              <span>Перейти к карточке</span>
                            </button>

                            {/* "В чате" button */}
                            <a
                              href={telegramLink}
                              target="_blank"
                              rel="noreferrer"
                              className="py-1 px-2 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 text-[11px] font-semibold transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
                              title="Открыть топик / сообщение в Telegram"
                            >
                              <Send className="w-3 h-3 text-sky-600" />
                              <span>В чате</span>
                            </a>
                          </div>

                          {/* Editor and Designer MUST NOT be able to schedule publication */}
                          {col.id === 'delivered' && activeRole !== 'editor' && activeRole !== 'designer' && (
                            <button
                              onClick={() => openPubModal(task)}
                              className="py-1 px-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-[11px] font-bold transition-colors flex items-center gap-1 cursor-pointer"
                              title="Настроить даты пробного режима и публикации"
                            >
                              <Calendar className="w-3 h-3 text-emerald-600" />
                              <span>Публикация</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Добавить обложку отдельной командой (/cover) */}
      {coverModalTaskId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-5 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-50 text-indigo-700">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    Прикрепить обложку #{coverModalTaskId}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Запускает отдельную команду <code className="text-indigo-600 font-mono">/cover</code> в чате
                  </p>
                </div>
              </div>
              <button onClick={() => setCoverModalTaskId(null)} className="text-slate-400 hover:text-slate-700 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAttachCoverSubmit} className="space-y-3.5 text-xs">
              <div className="p-3 bg-indigo-50/70 rounded-xl border border-indigo-200 text-indigo-900 text-xs">
                <strong>Команда обложки:</strong> Прикрепляет отдельный файл обложки к смонтированному видео для отображения в сетке Instagram/Reels.
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Ссылка на изображение обложки (JPG / PNG):
                </label>
                <input
                  type="text"
                  value={coverUrlInput}
                  onChange={(e) => setCoverUrlInput(e.target.value)}
                  placeholder="https://t.me/c/2145893201/cover_v1.jpg"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Если пусто, будет установлен стильный референс обложки высокого разрешения.
                </span>
              </div>

              {/* Quick Cover Presets */}
              <div>
                <span className="text-[11px] font-semibold text-slate-600 mb-1 block">Быстрые варианты:</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCoverUrlInput('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80')}
                    className="p-1.5 border border-slate-200 rounded-lg text-left hover:bg-slate-50 flex items-center gap-2"
                  >
                    <img src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=80" alt="Preset 1" className="w-8 h-10 object-cover rounded" />
                    <span className="text-[10px] font-medium text-slate-700">Минимализм Графика</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCoverUrlInput('https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80')}
                    className="p-1.5 border border-slate-200 rounded-lg text-left hover:bg-slate-50 flex items-center gap-2"
                  >
                    <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80" alt="Preset 2" className="w-8 h-10 object-cover rounded" />
                    <span className="text-[10px] font-medium text-slate-700">Портрет Эксперта</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Примечание к обложке:
                </label>
                <input
                  type="text"
                  value={coverNoteInput}
                  onChange={(e) => setCoverNoteInput(e.target.value)}
                  placeholder="Обложка с крупным хуком для ленты"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCoverModalTaskId(null)}
                  className="flex-1 py-2 px-3 rounded-lg border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-colors shadow-2xs flex items-center justify-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Отправить /cover</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Настройка дат публикации в колонке "Сдан" */}
      {pubModalTaskId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-5 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    Настройка публикации #{pubModalTaskId}
                  </h3>
                  <p className="text-xs text-slate-500">
                    График пробного режима и финального релиза
                  </p>
                </div>
              </div>
              <button onClick={() => setPubModalTaskId(null)} className="text-slate-400 hover:text-slate-700 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handlePublicationSubmit} className="space-y-3.5 text-xs">
              <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200 text-emerald-900 text-xs">
                ⏱ <strong>Пробный режим 48 часов:</strong> Позволяет оценить органический CTR и динамику удержания перед выводом в основную ленту профиля.
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Дата и время пробного режима:
                </label>
                <input
                  type="datetime-local"
                  value={trialDateInput}
                  onChange={(e) => setTrialDateInput(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Дата и время основной публикации в ленту:
                </label>
                <input
                  type="datetime-local"
                  value={publishDateInput}
                  onChange={(e) => setPublishDateInput(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {/* Quick shortcuts */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setTrialDateInput(new Date().toISOString().slice(0, 16));
                    const future = new Date(Date.now() + 48 * 3600 * 1000).toISOString().slice(0, 16);
                    setPublishDateInput(future);
                  }}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-medium"
                >
                  Старт теста сейчас (+48ч)
                </button>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPubModalTaskId(null)}
                  className="flex-1 py-2 px-3 rounded-lg border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-colors shadow-2xs"
                >
                  Сохранить график
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Забраковать на любом этапе */}
      {rejectModalTaskId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-5 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-slate-100 text-slate-700">
                  <Ban className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    Забраковать задачу #{rejectModalTaskId}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Фиксация брака с уведомлением команды в боте
                  </p>
                </div>
              </div>
              <button onClick={() => setRejectModalTaskId(null)} className="text-slate-400 hover:text-slate-700 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRejectSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Этап браковки:
                </label>
                <select
                  value={rejectStage}
                  onChange={(e) => setRejectStage(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-500 focus:outline-none"
                >
                  <option value="idea">Идея</option>
                  <option value="script">Сценарий</option>
                  <option value="video">Видео / Съемка</option>
                  <option value="editing">Монтаж / Разработка</option>
                  <option value="delivered">Сдан / Финальный отсмотр</option>
                </select>
              </div>

              {/* Preset reasons */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Быстрые причины брака:
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {(rejectStagePresets[rejectStage] || []).map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setRejectReason(preset)}
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 rounded-lg text-[10px] font-medium transition-colors text-left"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Подробная причина брака:
                </label>
                <textarea
                  required
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Опишите дефект или причину снятия задачи с производства..."
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRejectModalTaskId(null)}
                  className="flex-1 py-2 px-3 rounded-lg border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-900 text-white font-bold transition-colors shadow-2xs"
                >
                  Подтвердить брак
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Прикрепить рендер (Запускает команду /render в чате Telegram) */}
      {renderModalTaskId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-5 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-purple-50 text-purple-700">
                  <Video className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    Прикрепить рендер #{renderModalTaskId}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Запускает команду <code className="text-purple-600 font-mono">/render</code> ботом в чате
                  </p>
                </div>
              </div>
              <button
                onClick={() => setRenderModalTaskId(null)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAttachRenderSubmit} className="space-y-3.5 text-xs">
              <div className="p-3 bg-purple-50/70 rounded-xl border border-purple-200 text-purple-900 text-xs">
                <strong>Команда в чате:</strong> Бот примет файл рендера, прикрепит его к карточке #{renderModalTaskId} и сразу отправит эксперту пост с кнопками <strong>[Одобрено]</strong> и <strong>[Нужны правки]</strong>.
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Ссылка на видео / файл рендера (MP4 / облако):
                </label>
                <input
                  type="text"
                  value={renderUrlInput}
                  onChange={(e) => setRenderUrlInput(e.target.value)}
                  placeholder="https://t.me/c/2145893201/render_v1.mp4"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Если пусто, используется демонстрационный ролик высокого разрешения.
                </span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Примечание монтажера (версия / правки):
                </label>
                <input
                  type="text"
                  value={renderNoteInput}
                  onChange={(e) => setRenderNoteInput(e.target.value)}
                  placeholder="Черновой монтаж v1 с субтитрами"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  required
                />
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRenderModalTaskId(null)}
                  className="flex-1 py-2 px-3 rounded-lg border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 px-3 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold transition-colors shadow-2xs flex items-center justify-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Запустить /render</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Дополнить идею (войс, видео, мысль в чате) */}
      {supplementModalTaskId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-5 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
                  <Paperclip className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    Дополнить идею #{supplementModalTaskId}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Досыл голосовой заметки, видео-референса или мысли
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSupplementModalTaskId(null)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAppendSupplementSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  Тип досылаемых материалов:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setSupplementType('voice')}
                    className={`p-2 rounded-lg border text-center transition-all ${
                      supplementType === 'voice' 
                        ? 'bg-amber-50 border-amber-400 text-amber-900 font-bold' 
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Mic className="w-4 h-4 mx-auto mb-1 text-amber-600" />
                    <span>Войс</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSupplementType('video')}
                    className={`p-2 rounded-lg border text-center transition-all ${
                      supplementType === 'video' 
                        ? 'bg-amber-50 border-amber-400 text-amber-900 font-bold' 
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Video className="w-4 h-4 mx-auto mb-1 text-purple-600" />
                    <span>Видео</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSupplementType('text')}
                    className={`p-2 rounded-lg border text-center transition-all ${
                      supplementType === 'text' 
                        ? 'bg-amber-50 border-amber-400 text-amber-900 font-bold' 
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <FileText className="w-4 h-4 mx-auto mb-1 text-blue-600" />
                    <span>Мысль</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Краткое содержание / транскрибация / ссылка:
                </label>
                <textarea
                  value={supplementNote}
                  onChange={(e) => setSupplementNote(e.target.value)}
                  placeholder="Опишите дополнительную мысль к идее..."
                  rows={3}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  required
                />
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSupplementModalTaskId(null)}
                  className="flex-1 py-2 px-3 rounded-lg border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 px-3 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold transition-colors shadow-2xs flex items-center justify-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Дослать в чат</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Дослать материалы (Пул исходников) */}
      {poolModalTaskId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-5 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-rose-50 text-rose-700">
                  <FolderPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    Дослать материалы к #{poolModalTaskId}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Формирование нового пула исходников в чате
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPoolModalTaskId(null)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddPoolSubmit} className="space-y-3.5 text-xs">
              <div className="p-3 bg-rose-50/70 rounded-xl border border-rose-200 text-rose-900 text-xs">
                <strong>Как работают пулы:</strong> Каждая отправка дублей в чат создает отдельный пул (Пул 1 — основа, Пул 2, 3... — досъем b-roll). Монтажер видит ссылки на каждый пул прямо в задаче.
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Количество досылаемых видеофайлов:
                </label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={poolFilesCount}
                  onChange={(e) => setPoolFilesCount(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Примечание к пулу:
                </label>
                <input
                  type="text"
                  value={poolNote}
                  onChange={(e) => setPoolNote(e.target.value)}
                  placeholder="Дополнительные дубли текста и b-roll"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPoolModalTaskId(null)}
                  className="flex-1 py-2 px-3 rounded-lg border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 px-3 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold transition-colors shadow-2xs flex items-center justify-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Дослать пул</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

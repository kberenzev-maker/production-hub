import React, { useState, useMemo } from 'react';
import { useProduction } from '../context/ProductionContext';
import { TaskCard, ContentType } from '../types';
import { 
  CheckCircle2, 
  Lock, 
  ExternalLink, 
  Calendar, 
  Edit3, 
  Video, 
  Plus, 
  Check, 
  Search,
  X,
  CalendarDays,
  AlertTriangle,
  SlidersHorizontal
} from 'lucide-react';

export type StageFilterOption = 'all' | 'ideas' | 'in_progress' | 'ready';

export const ContentLayersView: React.FC = () => {
  const { 
    tasks, 
    currentExpertId, 
    activeRole, 
    updateTaskDetails, 
    scheduleShooting, 
    createIdea,
    rejectTask,
    restoreTask,
    addBotLog
  } = useProduction();

  // Filters
  const [filterType, setFilterType] = useState<ContentType | 'all'>('all');
  const [isFormatFilterOpen, setIsFormatFilterOpen] = useState(false);
  const [stageFilter, setStageFilter] = useState<StageFilterOption>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Active layer selection per task
  const [activeLayersMap, setActiveLayersMap] = useState<Record<string, number>>({});
  const [scriptDrafts, setScriptDrafts] = useState<Record<string, string>>({});
  const [carouselMaterialsInput, setCarouselMaterialsInput] = useState<Record<string, string>>({});

  // Rejection modal
  const [rejectModalData, setRejectModalData] = useState<{
    taskId: string;
    stage: 'idea' | 'script' | 'video' | 'editing' | 'delivered';
    taskTitle: string;
  } | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // Create Idea modal
  const [isCreateIdeaOpen, setIsCreateIdeaOpen] = useState(false);
  const [newIdeaTitle, setNewIdeaTitle] = useState('');
  const [newIdeaType, setNewIdeaType] = useState<ContentType>('reels');
  const [newIdeaDesc, setNewIdeaDesc] = useState('');
  const [newIdeaTargetDate, setNewIdeaTargetDate] = useState('');

  // Edit Idea modal
  const [editingIdeaTask, setEditingIdeaTask] = useState<TaskCard | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editType, setEditType] = useState<ContentType>('reels');
  const [editDesc, setEditDesc] = useState('');
  const [editDueDate, setEditDueDate] = useState('');

  const isEditor = activeRole === 'editor';
  const isDesigner = activeRole === 'designer';

  // Determine current natural layer (1 to 5)
  const getNaturalLayer = (task: TaskCard): number => {
    if (task.editingStatus === 'green') return 5;
    if (task.type === 'reels') {
      if (task.shootingStatus === 'green' || (task.pools && task.pools.length > 0)) return 4;
    } else {
      if (task.shootingStatus === 'green' || task.editingStatus === 'yellow') return 4;
    }
    if (task.scriptStatus === 'green') return 3;
    if (task.scriptStatus === 'yellow' || (task.scriptText && task.scriptText.trim().length > 0)) return 2;
    return 1;
  };

  const getActiveLayer = (task: TaskCard): number => {
    if (activeLayersMap[task.id] !== undefined) {
      return activeLayersMap[task.id];
    }
    return getNaturalLayer(task);
  };

  const setCardLayer = (taskId: string, layerNum: number) => {
    setActiveLayersMap(prev => ({ ...prev, [taskId]: layerNum }));
  };

  // Base list of tasks for current expert
  const expertTasks = useMemo(() => {
    return tasks.filter(t => 
      t.expertId === currentExpertId && 
      t.kind !== 'non_content' && 
      (t.type === 'reels' || t.type === 'carousel' || t.type === 'stories')
    );
  }, [tasks, currentExpertId]);

  // Counts for Stage tabs
  const stageCounts = useMemo(() => {
    const valid = expertTasks.filter(t => !t.isArchived && !t.rejected);
    return {
      all: valid.length,
      ideas: valid.filter(t => getNaturalLayer(t) === 1 && t.placement !== 'main_feed').length,
      in_progress: valid.filter(t => [2, 3, 4].includes(getNaturalLayer(t)) && t.placement !== 'main_feed').length,
      ready: valid.filter(t => (getNaturalLayer(t) === 5 || t.renderApprovedByExpert) && t.placement !== 'main_feed').length,
    };
  }, [expertTasks]);

  // Filtered tasks
  const filteredTasks = useMemo(() => {
    return expertTasks.filter(t => {
      if (t.isArchived || t.rejected) return false;

      if (stageFilter === 'ideas' && (getNaturalLayer(t) !== 1 || t.placement === 'main_feed')) return false;
      if (stageFilter === 'in_progress' && (![2, 3, 4].includes(getNaturalLayer(t)) || t.placement === 'main_feed')) return false;
      if (stageFilter === 'ready' && !(getNaturalLayer(t) === 5 || t.renderApprovedByExpert)) return false;

      if (isEditor && t.type !== 'reels') return false;
      if (isDesigner && t.type === 'reels') return false;

      if (filterType !== 'all' && t.type !== filterType) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = t.title.toLowerCase().includes(q);
        const matchId = t.id.includes(q);
        const matchDesc = (t.ideaDescription || '').toLowerCase().includes(q);
        return matchTitle || matchId || matchDesc;
      }

      return true;
    });
  }, [expertTasks, stageFilter, isEditor, isDesigner, filterType, searchQuery]);

  // Handlers
  const handleTakeToScript = (taskId: string) => {
    setCardLayer(taskId, 2);
    updateTaskDetails(taskId, {
      scriptStatus: 'yellow'
    });
  };

  const handleSaveScriptDraft = (task: TaskCard, text: string) => {
    updateTaskDetails(task.id, {
      scriptText: text,
      scriptStatus: 'yellow',
      scriptUpdatedAt: new Date().toISOString()
    });
  };

  const handleApproveScript = (task: TaskCard, text: string) => {
    updateTaskDetails(task.id, {
      scriptText: text || task.scriptText || '',
      scriptStatus: 'green',
      scriptUpdatedAt: new Date().toISOString()
    });
    setCardLayer(task.id, 3);
  };

  const handleSendShootingMaterials = (task: TaskCard) => {
    const pools = task.pools && task.pools.length > 0 ? task.pools : [
      {
        id: `pool-1-${task.id}`,
        poolNumber: 1,
        name: 'Исходники съёмки',
        filesCount: 14,
        telegramChatLink: `https://t.me/c/2145893021/3/${task.id}01`,
        uploadedAt: new Date().toISOString()
      }
    ];

    updateTaskDetails(task.id, {
      shootingStatus: 'green',
      materialsTotalCount: 14,
      pools,
      editingStatus: 'yellow',
      assignedEditor: task.assignedEditor || '@arseniy_editor'
    });

    addBotLog('Съёмка', `Исходники по задаче #${task.id} переданы в монтаж.`, 'shooting_materials_requested');
    setCardLayer(task.id, 4);
  };

  const handleSendCarouselMaterials = (task: TaskCard, materialsLink?: string) => {
    const currentPools = task.pools || [];
    const newPools = materialsLink && materialsLink.trim().length > 0 ? [
      ...currentPools,
      {
        id: `pool-car-${task.id}`,
        poolNumber: currentPools.length + 1,
        name: 'Материалы',
        filesCount: 5,
        telegramChatLink: materialsLink.trim(),
        uploadedAt: new Date().toISOString()
      }
    ] : currentPools;

    updateTaskDetails(task.id, {
      shootingStatus: 'green',
      pools: newPools,
      editingStatus: 'yellow',
      assignedDesigner: task.assignedDesigner || '@marina_designer'
    });

    addBotLog('Дизайн', `Материалы по задаче #${task.id} переданы дизайнеру.`, 'design_started');
    setCardLayer(task.id, 4);
  };

  const handleSubmitRender = (task: TaskCard) => {
    updateTaskDetails(task.id, {
      editingStatus: 'green',
      renderUrl: task.renderUrl || 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=800&auto=format&fit=crop&q=80',
      coverUrl: task.coverUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
      renderDeliveredAt: new Date().toISOString()
    });
    setCardLayer(task.id, 5);
  };

  const handleSubmitDesign = (task: TaskCard) => {
    updateTaskDetails(task.id, {
      editingStatus: 'green',
      coverUrl: task.coverUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
      renderUrl: task.renderUrl || 'https://images.unsplash.com/photo-1558655146-d09347e92766?w=800&auto=format&fit=crop&q=80',
      renderDeliveredAt: new Date().toISOString()
    });
    setCardLayer(task.id, 5);
  };

  const handleExpertApprove = (task: TaskCard) => {
    updateTaskDetails(task.id, {
      renderApprovedByExpert: true,
      renderNeedsRevision: false
    });
  };

  const handleTransferToPublication = (task: TaskCard) => {
    if (task.kind === 'non_content' || !['reels', 'carousel', 'stories'].includes(task.type)) {
      return;
    }
    updateTaskDetails(task.id, {
      placement: 'unassigned',
      renderApprovedByExpert: true
    });
  };

  const handleOpenRejectModal = (task: TaskCard) => {
    const natural = getNaturalLayer(task);
    let stageKey: 'idea' | 'script' | 'video' | 'editing' | 'delivered' = 'idea';
    if (natural === 5) stageKey = 'delivered';
    else if (natural === 4) stageKey = 'editing';
    else if (natural === 3) stageKey = 'video';
    else if (natural === 2) stageKey = 'script';

    setRejectModalData({
      taskId: task.id,
      stage: stageKey,
      taskTitle: task.title
    });
    setRejectReason('');
  };

  const handleConfirmReject = () => {
    if (!rejectModalData) return;
    rejectTask(
      rejectModalData.taskId,
      rejectModalData.stage,
      rejectReason.trim() || 'Снято с производства'
    );
    setRejectModalData(null);
    setRejectReason('');
  };

  const handleStartEditIdea = (task: TaskCard) => {
    setEditingIdeaTask(task);
    setEditTitle(task.title);
    setEditType(task.type);
    setEditDesc(task.ideaDescription || '');
    setEditDueDate(task.targetDueDate || '');
  };

  const handleSaveEditIdea = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingIdeaTask || !editTitle.trim()) return;
    updateTaskDetails(editingIdeaTask.id, {
      title: editTitle.trim(),
      type: editType,
      ideaDescription: editDesc.trim(),
      targetDueDate: editDueDate || undefined,
    });
    setEditingIdeaTask(null);
  };

  const handleCreateIdeaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIdeaTitle.trim()) return;
    const created = createIdea({
      title: newIdeaTitle.trim(),
      type: newIdeaType,
      note: newIdeaDesc.trim() || undefined,
      targetDueDate: newIdeaTargetDate || undefined
    });
    setIsCreateIdeaOpen(false);
    setNewIdeaTitle('');
    setNewIdeaDesc('');
    setNewIdeaTargetDate('');
    if (created && created.id) {
      setCardLayer(created.id, 1);
    }
  };

  return (
    <div className="space-y-3">
      {/* iOS Search Bar with Filter and Action buttons */}
      <div className="relative flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#8E8E93] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            dir="ltr"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск по контенту"
            className="w-full pl-9 pr-8 py-2 bg-[#767680]/12 text-black placeholder-[#8E8E93] text-[15px] rounded-[10px] focus:outline-none transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8E8E93] hover:text-black cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter button with sliders-horizontal */}
        <button
          type="button"
          onClick={() => setIsFormatFilterOpen(prev => !prev)}
          className={`h-9 px-3 rounded-[10px] flex items-center justify-center transition-colors cursor-pointer ${
            filterType !== 'all' || isFormatFilterOpen
              ? 'bg-[#007AFF] text-white'
              : 'bg-[#767680]/12 text-black hover:bg-[#767680]/18'
          }`}
          title="Фильтр форматов"
        >
          <SlidersHorizontal className="w-4 h-4" />
        </button>

        {/* Add Idea Button */}
        <button
          type="button"
          onClick={() => setIsCreateIdeaOpen(true)}
          className="h-9 px-3 bg-[#007AFF] hover:bg-[#007AFF]/90 text-white rounded-[10px] text-[13px] font-semibold flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Идея</span>
        </button>

        {/* iOS Dropdown Menu / Action Sheet */}
        {isFormatFilterOpen && (
          <div className="absolute right-12 top-11 z-30 bg-white rounded-[14px] shadow-xl border border-black/5 py-1.5 w-44 divide-y divide-[#C6C6C8]/30 animate-in fade-in">
            {[
              { id: 'all', label: 'Все форматы' },
              { id: 'reels', label: 'Reels' },
              { id: 'carousel', label: 'Карусели' },
              { id: 'stories', label: 'Stories' }
            ].map(f => (
              <button
                key={f.id}
                type="button"
                onClick={() => {
                  setFilterType(f.id as any);
                  setIsFormatFilterOpen(false);
                }}
                className="w-full px-3.5 py-2 text-left text-[14px] flex items-center justify-between hover:bg-[#767680]/10 transition-colors cursor-pointer"
              >
                <span className={filterType === f.id ? 'font-semibold text-black' : 'text-black'}>
                  {f.label}
                </span>
                {filterType === f.id && <Check className="w-4 h-4 text-[#007AFF]" />}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* iOS Segmented Control: strictly 4 equal segments on 100% width */}
      <div className="bg-[#767680]/12 p-0.5 rounded-[9px] w-full grid grid-cols-4 select-none">
        {[
          { id: 'all', label: `Все (${stageCounts.all})` },
          { id: 'ideas', label: `Идеи (${stageCounts.ideas})` },
          { id: 'in_progress', label: `В работе (${stageCounts.in_progress})` },
          { id: 'ready', label: `Готово (${stageCounts.ready})` }
        ].map(st => (
          <button
            key={st.id}
            type="button"
            onClick={() => setStageFilter(st.id as StageFilterOption)}
            className={`py-1.5 text-[12px] sm:text-[13px] font-medium rounded-[7px] text-center transition-all cursor-pointer truncate ${
              stageFilter === st.id
                ? 'bg-white text-black shadow-xs font-semibold'
                : 'text-[#8E8E93] hover:text-black'
            }`}
          >
            {st.label}
          </button>
        ))}
      </div>

      {/* Tasks Vertical Stepper List (iOS Inset Grouped) */}
      <div className="space-y-6">
        {filteredTasks.length === 0 ? (
          <div className="bg-white rounded-[16px] p-8 text-center text-[#8E8E93]">
            <p className="text-[15px] font-medium text-black">Материалов нет</p>
          </div>
        ) : (
          filteredTasks.map(task => {
            const naturalLayer = getNaturalLayer(task);
            const activeLayer = getActiveLayer(task);
            const draftValue = scriptDrafts[task.id] !== undefined ? scriptDrafts[task.id] : (task.scriptText || '');

            return (
              <div key={task.id} className="space-y-1.5">
                {/* Section Header: ID, Title, Type, and Destructive action */}
                <div className="flex items-center justify-between ml-4 mr-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[13px] font-normal text-[#8E8E93] uppercase tracking-wider shrink-0">
                      #{task.id} • {task.type.toUpperCase()}
                    </span>
                    {task.targetDueDate && (
                      <span className="text-[12px] text-[#8E8E93] flex items-center gap-1 shrink-0">
                        <CalendarDays className="w-3 h-3" />
                        <span>{task.targetDueDate}</span>
                      </span>
                    )}
                  </div>

                  {!task.rejected ? (
                    <button
                      type="button"
                      onClick={() => handleOpenRejectModal(task)}
                      className="text-[13px] text-[#FF3B30] font-medium cursor-pointer"
                    >
                      Забраковать
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => restoreTask(task.id)}
                      className="text-[13px] text-[#007AFF] font-medium cursor-pointer"
                    >
                      Восстановить
                    </button>
                  )}
                </div>

                {/* iOS Inset Grouped Section */}
                <div className="bg-white rounded-[16px] divide-y divide-[#C6C6C8]/40 overflow-hidden">
                  
                  {/* Row 0: Entity Title */}
                  <div className="px-4 py-3 flex items-center justify-between gap-3">
                    <h3 className="text-[16px] font-semibold text-black tracking-tight leading-snug">
                      {task.title}
                    </h3>
                    <span className="text-[12px] font-medium text-[#8E8E93] shrink-0">
                      {task.rejected ? 'Брак' : `${naturalLayer} из 5`}
                    </span>
                  </div>

                  {/* Rejected Banner if rejected */}
                  {task.rejected && (
                    <div className="px-4 py-3 bg-[#FF3B30]/10 text-[13px] text-[#FF3B30] flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>{task.rejectedReason || 'Снято с производства'}</span>
                    </div>
                  )}

                  {!task.rejected && (
                    <>
                      {/* STEP 1: ИДЕЯ */}
                      <div className="transition-colors">
                        {naturalLayer > 1 && activeLayer !== 1 ? (
                          <div
                            onClick={() => setCardLayer(task.id, 1)}
                            className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-black/[0.02]"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <CheckCircle2 className="w-4 h-4 text-[#34C759] shrink-0" />
                              <span className="text-[15px] font-medium text-black shrink-0">Идея</span>
                              <span className="text-[13px] text-[#8E8E93] truncate">
                                {task.ideaDescription || 'Зафиксирована'}
                              </span>
                            </div>
                            <span className="text-[13px] text-[#007AFF] font-medium shrink-0 ml-2">
                              Показать
                            </span>
                          </div>
                        ) : activeLayer === 1 ? (
                          <div className="p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-[13px] font-semibold text-black uppercase tracking-wide">
                                Степ 1: Идея
                              </span>
                              <button
                                type="button"
                                onClick={() => handleStartEditIdea(task)}
                                className="text-[13px] text-[#007AFF] font-medium cursor-pointer"
                              >
                                Редактировать
                              </button>
                            </div>

                            <p className="text-[14px] text-black leading-relaxed">
                              {task.ideaDescription || 'Идея зафиксирована из чата.'}
                            </p>

                            <div className="flex items-center justify-between text-[13px] pt-1">
                              <span className="text-[#8E8E93]">Дедлайн:</span>
                              <input
                                type="date"
                                dir="ltr"
                                value={task.targetDueDate || ''}
                                onChange={(e) => updateTaskDetails(task.id, { targetDueDate: e.target.value })}
                                className="text-black bg-transparent font-medium focus:outline-none"
                              />
                            </div>

                            <button
                              type="button"
                              onClick={() => handleTakeToScript(task.id)}
                              className="w-full h-11 bg-[#007AFF] hover:bg-[#007AFF]/90 text-white font-semibold text-[15px] rounded-[12px] flex items-center justify-center transition-colors cursor-pointer"
                            >
                              Взять в сценарий
                            </button>
                          </div>
                        ) : null}
                      </div>

                      {/* STEP 2: СЦЕНАРИЙ */}
                      <div className="transition-colors">
                        {naturalLayer < 2 ? (
                          <div className="px-4 py-3 flex items-center gap-3 text-[#8E8E93]">
                            <Lock className="w-4 h-4 text-[#8E8E93] shrink-0" />
                            <span className="text-[15px]">Сценарий</span>
                          </div>
                        ) : naturalLayer > 2 && activeLayer !== 2 ? (
                          <div
                            onClick={() => setCardLayer(task.id, 2)}
                            className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-black/[0.02]"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <CheckCircle2 className="w-4 h-4 text-[#34C759] shrink-0" />
                              <span className="text-[15px] font-medium text-black shrink-0">Сценарий</span>
                              <span className="text-[13px] text-[#8E8E93] truncate">
                                {task.scriptText ? task.scriptText.slice(0, 45) + '...' : 'Утвержден'}
                              </span>
                            </div>
                            <span className="text-[13px] text-[#007AFF] font-medium shrink-0 ml-2">
                              Показать
                            </span>
                          </div>
                        ) : activeLayer === 2 ? (
                          <div className="p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-[13px] font-semibold text-black uppercase tracking-wide">
                                Степ 2: Сценарий
                              </span>
                              <span className="text-[12px] text-[#8E8E93]">
                                {draftValue.trim() ? draftValue.trim().split(/\s+/).length : 0} слов • ~{Math.ceil((draftValue.trim() ? draftValue.trim().split(/\s+/).length : 0) / 2)} с
                              </span>
                            </div>

                            <textarea
                              rows={5}
                              dir="ltr"
                              placeholder="Текст сценария..."
                              value={draftValue}
                              onChange={(e) => {
                                const val = e.target.value;
                                setScriptDrafts(prev => ({ ...prev, [task.id]: val }));
                              }}
                              className="w-full p-2.5 text-[14px] text-black bg-[#767680]/8 rounded-[10px] focus:outline-none resize-none leading-relaxed"
                            />

                            <div className="flex items-center gap-2 pt-1">
                              <button
                                type="button"
                                onClick={() => handleSaveScriptDraft(task, draftValue)}
                                className="flex-1 h-11 bg-[#767680]/12 text-[#007AFF] hover:bg-[#767680]/18 font-semibold text-[15px] rounded-[12px] flex items-center justify-center transition-colors cursor-pointer"
                              >
                                Сохранить
                              </button>
                              <button
                                type="button"
                                onClick={() => handleApproveScript(task, draftValue)}
                                className="flex-1 h-11 bg-[#007AFF] hover:bg-[#007AFF]/90 text-white font-semibold text-[15px] rounded-[12px] flex items-center justify-center transition-colors cursor-pointer"
                              >
                                Утвердить
                              </button>
                            </div>
                          </div>
                        ) : null}
                      </div>

                      {/* STEP 3: СЪЁМКА / МАТЕРИАЛЫ */}
                      <div className="transition-colors">
                        {naturalLayer < 3 ? (
                          <div className="px-4 py-3 flex items-center gap-3 text-[#8E8E93]">
                            <Lock className="w-4 h-4 text-[#8E8E93] shrink-0" />
                            <span className="text-[15px]">
                              {task.type === 'reels' ? 'Съёмка' : 'Материалы'}
                            </span>
                          </div>
                        ) : naturalLayer > 3 && activeLayer !== 3 ? (
                          <div
                            onClick={() => setCardLayer(task.id, 3)}
                            className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-black/[0.02]"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <CheckCircle2 className="w-4 h-4 text-[#34C759] shrink-0" />
                              <span className="text-[15px] font-medium text-black shrink-0">
                                {task.type === 'reels' ? 'Съёмка' : 'Материалы'}
                              </span>
                              <span className="text-[13px] text-[#8E8E93] truncate">
                                {task.type === 'reels' ? 'Исходники сданы' : 'Передано дизайнеру'}
                              </span>
                            </div>
                            <span className="text-[13px] text-[#007AFF] font-medium shrink-0 ml-2">
                              Показать
                            </span>
                          </div>
                        ) : activeLayer === 3 ? (
                          <div className="p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-[13px] font-semibold text-black uppercase tracking-wide">
                                Степ 3: {task.type === 'reels' ? 'Съёмка' : 'Материалы'}
                              </span>
                            </div>

                            {task.type === 'reels' ? (
                              <div className="space-y-3">
                                <div className="flex items-center justify-between text-[14px]">
                                  <span className="text-[#8E8E93]">Дата съёмки:</span>
                                  <input
                                    type="datetime-local"
                                    dir="ltr"
                                    value={task.shootingDate || ''}
                                    onChange={(e) => scheduleShooting(task.id, e.target.value)}
                                    className="text-black bg-transparent font-medium focus:outline-none"
                                  />
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleSendShootingMaterials(task)}
                                  className="w-full h-11 bg-[#007AFF] hover:bg-[#007AFF]/90 text-white font-semibold text-[15px] rounded-[12px] flex items-center justify-center transition-colors cursor-pointer"
                                >
                                  Сдать исходники
                                </button>
                              </div>
                            ) : (
                              <div className="space-y-3">
                                <input
                                  type="text"
                                  dir="ltr"
                                  placeholder="Ссылка на материалы (диск / референсы)"
                                  value={carouselMaterialsInput[task.id] || ''}
                                  onChange={(e) => setCarouselMaterialsInput(prev => ({ ...prev, [task.id]: e.target.value }))}
                                  className="w-full px-3 py-2 text-[14px] text-black bg-[#767680]/8 rounded-[10px] focus:outline-none"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleSendCarouselMaterials(task, carouselMaterialsInput[task.id])}
                                  className="w-full h-11 bg-[#007AFF] hover:bg-[#007AFF]/90 text-white font-semibold text-[15px] rounded-[12px] flex items-center justify-center transition-colors cursor-pointer"
                                >
                                  Передать на дизайн
                                </button>
                              </div>
                            )}
                          </div>
                        ) : null}
                      </div>

                      {/* STEP 4: МОНТАЖ / ДИЗАЙН */}
                      <div className="transition-colors">
                        {naturalLayer < 4 ? (
                          <div className="px-4 py-3 flex items-center gap-3 text-[#8E8E93]">
                            <Lock className="w-4 h-4 text-[#8E8E93] shrink-0" />
                            <span className="text-[15px]">
                              {task.type === 'reels' ? 'Монтаж' : 'Дизайн'}
                            </span>
                          </div>
                        ) : naturalLayer > 4 && activeLayer !== 4 ? (
                          <div
                            onClick={() => setCardLayer(task.id, 4)}
                            className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-black/[0.02]"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <CheckCircle2 className="w-4 h-4 text-[#34C759] shrink-0" />
                              <span className="text-[15px] font-medium text-black shrink-0">
                                {task.type === 'reels' ? 'Монтаж' : 'Дизайн'}
                              </span>
                              <span className="text-[13px] text-[#8E8E93] truncate">
                                Сдано
                              </span>
                            </div>
                            <span className="text-[13px] text-[#007AFF] font-medium shrink-0 ml-2">
                              Показать
                            </span>
                          </div>
                        ) : activeLayer === 4 ? (
                          <div className="p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-[13px] font-semibold text-black uppercase tracking-wide">
                                Степ 4: {task.type === 'reels' ? 'Монтаж' : 'Дизайн'}
                              </span>
                              <span className="text-[12px] text-[#8E8E93]">
                                {task.type === 'reels' ? task.assignedEditor || '@arseniy_editor' : task.assignedDesigner || '@marina_designer'}
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => task.type === 'reels' ? handleSubmitRender(task) : handleSubmitDesign(task)}
                              className="w-full h-11 bg-[#007AFF] hover:bg-[#007AFF]/90 text-white font-semibold text-[15px] rounded-[12px] flex items-center justify-center transition-colors cursor-pointer"
                            >
                              {task.type === 'reels' ? 'Сдать ролик' : 'Сдать дизайн'}
                            </button>
                          </div>
                        ) : null}
                      </div>

                      {/* STEP 5: ПРИЁМКА ЭКСПЕРТОМ */}
                      <div className="transition-colors">
                        {naturalLayer < 5 ? (
                          <div className="px-4 py-3 flex items-center gap-3 text-[#8E8E93]">
                            <Lock className="w-4 h-4 text-[#8E8E93] shrink-0" />
                            <span className="text-[15px]">Приёмка</span>
                          </div>
                        ) : (
                          <div className="p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-[13px] font-semibold text-black uppercase tracking-wide">
                                Степ 5: Приёмка
                              </span>
                              {task.renderApprovedByExpert && (
                                <span className="text-[12px] font-medium text-[#34C759] flex items-center gap-1">
                                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                                  <span>Одобрено</span>
                                </span>
                              )}
                            </div>

                            {/* Thumbnail and preview links */}
                            <div className="flex items-center justify-between py-1">
                              <div className="flex items-center gap-2.5">
                                {task.coverUrl ? (
                                  <img src={task.coverUrl} alt="" className="w-10 h-10 rounded-[8px] object-cover" />
                                ) : (
                                  <div className="w-10 h-10 rounded-[8px] bg-[#767680]/12 flex items-center justify-center text-[#8E8E93]">
                                    <Video className="w-5 h-5" />
                                  </div>
                                )}
                                <div>
                                  <span className="text-[14px] font-medium text-black block">Готовый материал</span>
                                  <span className="text-[12px] text-[#8E8E93]">Рендер #{task.id}</span>
                                </div>
                              </div>

                              {task.renderUrl && (
                                <a
                                  href={task.renderUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-[13px] text-[#007AFF] font-medium flex items-center gap-1"
                                >
                                  <span>Смотреть</span>
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              )}
                            </div>

                            {/* Actions */}
                            {!task.renderApprovedByExpert ? (
                              <button
                                type="button"
                                onClick={() => handleExpertApprove(task)}
                                className="w-full h-11 bg-[#007AFF] hover:bg-[#007AFF]/90 text-white font-semibold text-[15px] rounded-[12px] flex items-center justify-center transition-colors cursor-pointer"
                              >
                                Утвердить
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleTransferToPublication(task)}
                                className="w-full h-11 bg-[#007AFF] hover:bg-[#007AFF]/90 text-white font-semibold text-[15px] rounded-[12px] flex items-center justify-center transition-colors cursor-pointer"
                              >
                                Передать на публикацию
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Reject Modal (Apple Sheet style) */}
      {rejectModalData && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="bg-white rounded-t-[20px] sm:rounded-[20px] w-full max-w-md p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-[16px] font-semibold text-black">Забраковать материал</h3>
              <button
                type="button"
                onClick={() => setRejectModalData(null)}
                className="text-[#8E8E93] hover:text-black cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-[13px] text-[#8E8E93]">
              #{rejectModalData.taskId} «{rejectModalData.taskTitle}»
            </p>

            <textarea
              rows={3}
              dir="ltr"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Причина брака..."
              className="w-full p-3 text-[14px] text-black bg-[#767680]/8 rounded-[12px] focus:outline-none resize-none"
            />

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectModalData(null)}
                className="flex-1 h-11 bg-[#767680]/12 text-[#007AFF] font-semibold text-[15px] rounded-[12px] cursor-pointer"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                className="flex-1 h-11 bg-[#FF3B30] text-white font-semibold text-[15px] rounded-[12px] cursor-pointer"
              >
                Забраковать
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Idea Modal (Apple Sheet style) */}
      {isCreateIdeaOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <form onSubmit={handleCreateIdeaSubmit} className="bg-white rounded-t-[20px] sm:rounded-[20px] w-full max-w-md p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-[16px] font-semibold text-black">Новая идея</h3>
              <button
                type="button"
                onClick={() => setIsCreateIdeaOpen(false)}
                className="text-[#8E8E93] hover:text-black cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <input
                type="text"
                dir="ltr"
                required
                value={newIdeaTitle}
                onChange={(e) => setNewIdeaTitle(e.target.value)}
                placeholder="Название идеи"
                className="w-full px-3 py-2.5 text-[14px] text-black bg-[#767680]/8 rounded-[10px] focus:outline-none"
              />

              <div className="flex items-center gap-2">
                {(['reels', 'carousel', 'stories'] as ContentType[]).map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setNewIdeaType(t)}
                    className={`flex-1 py-1.5 rounded-[8px] text-[13px] font-medium transition-colors cursor-pointer ${
                      newIdeaType === t
                        ? 'bg-[#007AFF] text-white'
                        : 'bg-[#767680]/12 text-[#8E8E93]'
                    }`}
                  >
                    {t === 'reels' ? 'Reels' : t === 'carousel' ? 'Карусель' : 'Stories'}
                  </button>
                ))}
              </div>

              <textarea
                rows={3}
                dir="ltr"
                value={newIdeaDesc}
                onChange={(e) => setNewIdeaDesc(e.target.value)}
                placeholder="Описание или заметки..."
                className="w-full p-2.5 text-[14px] text-black bg-[#767680]/8 rounded-[10px] focus:outline-none resize-none"
              />

              <div className="flex items-center justify-between text-[13px]">
                <span className="text-[#8E8E93]">Дедлайн:</span>
                <input
                  type="date"
                  dir="ltr"
                  value={newIdeaTargetDate}
                  onChange={(e) => setNewIdeaTargetDate(e.target.value)}
                  className="text-black bg-transparent font-medium focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsCreateIdeaOpen(false)}
                className="flex-1 h-11 bg-[#767680]/12 text-[#007AFF] font-semibold text-[15px] rounded-[12px] cursor-pointer"
              >
                Отмена
              </button>
              <button
                type="submit"
                className="flex-1 h-11 bg-[#007AFF] text-white font-semibold text-[15px] rounded-[12px] cursor-pointer"
              >
                Создать
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Idea Modal */}
      {editingIdeaTask && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <form onSubmit={handleSaveEditIdea} className="bg-white rounded-t-[20px] sm:rounded-[20px] w-full max-w-md p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-[16px] font-semibold text-black">Редактировать идею</h3>
              <button
                type="button"
                onClick={() => setEditingIdeaTask(null)}
                className="text-[#8E8E93] hover:text-black cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <input
                type="text"
                dir="ltr"
                required
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full px-3 py-2.5 text-[14px] text-black bg-[#767680]/8 rounded-[10px] focus:outline-none"
              />

              <div className="flex items-center gap-2">
                {(['reels', 'carousel', 'stories'] as ContentType[]).map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setEditType(t)}
                    className={`flex-1 py-1.5 rounded-[8px] text-[13px] font-medium transition-colors cursor-pointer ${
                      editType === t
                        ? 'bg-[#007AFF] text-white'
                        : 'bg-[#767680]/12 text-[#8E8E93]'
                    }`}
                  >
                    {t === 'reels' ? 'Reels' : t === 'carousel' ? 'Карусель' : 'Stories'}
                  </button>
                ))}
              </div>

              <textarea
                rows={3}
                dir="ltr"
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                className="w-full p-2.5 text-[14px] text-black bg-[#767680]/8 rounded-[10px] focus:outline-none resize-none"
              />

              <div className="flex items-center justify-between text-[13px]">
                <span className="text-[#8E8E93]">Дедлайн:</span>
                <input
                  type="date"
                  dir="ltr"
                  value={editDueDate}
                  onChange={(e) => setEditDueDate(e.target.value)}
                  className="text-black bg-transparent font-medium focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingIdeaTask(null)}
                className="flex-1 h-11 bg-[#767680]/12 text-[#007AFF] font-semibold text-[15px] rounded-[12px] cursor-pointer"
              >
                Отмена
              </button>
              <button
                type="submit"
                className="flex-1 h-11 bg-[#007AFF] text-white font-semibold text-[15px] rounded-[12px] cursor-pointer"
              >
                Сохранить
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

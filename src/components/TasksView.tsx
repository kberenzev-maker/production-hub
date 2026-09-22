import React, { useState, useMemo } from 'react';
import { useProduction } from '../context/ProductionContext';
import { TaskCard, SubTask } from '../types';
import { 
  Plus, 
  Search, 
  X,
  ChevronRight,
  Check,
  CheckCircle2, 
  Clock, 
  Circle, 
  Trash2,
  Calendar,
  ExternalLink,
  SlidersHorizontal
} from 'lucide-react';
import { CreateTaskModal } from './CreateTaskModal';

interface TasksViewProps {
  onOpenCreateTask?: () => void;
}

export const TasksView: React.FC<TasksViewProps> = () => {
  const { 
    tasks, 
    currentExpertId, 
    currentProjectId,
    currentProject,
    addSubtask, 
    updateSubtaskStatus, 
    updateMultipleSubtasksStatus,
    deleteSubtask, 
    toggleNonContentTaskStatus,
    chatUsers
  } = useProduction();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<'active' | 'done'>('active');
  const [expandedTaskIds, setExpandedTaskIds] = useState<Record<string, boolean>>({});
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // New subtask inputs state
  const [newSubtaskInputs, setNewSubtaskInputs] = useState<Record<string, { title: string; assignedTo: string; assignedAvatar: string }>>({});

  const currentChatIdStr = currentProject ? String(currentProject.chatId) : '';
  // Filter tasks to only non_content for current project / expert
  const nonContentTasks = useMemo(() => {
    return tasks.filter(t => {
      if (t.kind !== 'non_content') return false;
      if (currentProjectId && (t.projectId === currentProjectId || t.projectId === currentChatIdStr)) {
        return true;
      }
      return !t.projectId || t.expertId === currentExpertId;
    });
  }, [tasks, currentProjectId, currentChatIdStr, currentExpertId]);

  // Categories present
  const availableCategories = useMemo(() => {
    const set = new Set<string>(['Сайт', 'Кастдевы', 'Другое']);
    nonContentTasks.forEach(t => {
      if (t.nonContentCategory) set.add(t.nonContentCategory);
    });
    return Array.from(set);
  }, [nonContentTasks]);

  const activeCount = useMemo(() => {
    return nonContentTasks.filter(t => t.nonContentStatus !== 'done').length;
  }, [nonContentTasks]);

  const doneCount = useMemo(() => {
    return nonContentTasks.filter(t => t.nonContentStatus === 'done').length;
  }, [nonContentTasks]);

  // Filtered tasks
  const filteredTasks = useMemo(() => {
    return nonContentTasks.filter(t => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = t.title.toLowerCase().includes(q);
        const matchGoal = t.goal?.toLowerCase().includes(q);
        const matchDesc = t.description?.toLowerCase().includes(q);
        const matchSub = t.subtasks?.some(st => st.title.toLowerCase().includes(q));
        if (!matchTitle && !matchGoal && !matchDesc && !matchSub) return false;
      }

      if (selectedCategory !== 'all' && t.nonContentCategory !== selectedCategory) {
        return false;
      }

      const isDone = t.nonContentStatus === 'done';
      if (selectedStatus === 'active' && isDone) return false;
      if (selectedStatus === 'done' && !isDone) return false;

      return true;
    });
  }, [nonContentTasks, searchQuery, selectedCategory, selectedStatus]);

  const toggleExpand = (taskId: string) => {
    setExpandedTaskIds(prev => ({
      ...prev,
      [taskId]: !prev[taskId],
    }));
  };

  const handleAddSubtask = (taskId: string) => {
    const defaultAssigneeName = currentProject?.members?.[0]?.name || chatUsers[0]?.name || 'Кирилл';
    const inputState = newSubtaskInputs[taskId] || { 
      title: '', 
      assignedTo: defaultAssigneeName, 
      assignedAvatar: chatUsers[0]?.avatar || '' 
    };

    if (!inputState.title.trim()) return;

    addSubtask(
      taskId,
      inputState.title.trim(),
      inputState.assignedTo,
      inputState.assignedAvatar
    );

    setNewSubtaskInputs(prev => ({
      ...prev,
      [taskId]: {
        title: '',
        assignedTo: inputState.assignedTo,
        assignedAvatar: inputState.assignedAvatar
      }
    }));
  };

  return (
    <div className="space-y-3">
      {/* iOS Search Bar with Category Filter and Add Button */}
      <div className="relative flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#8E8E93] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            dir="ltr"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск по задачам"
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

        {/* Category Filter Button */}
        <button
          type="button"
          onClick={() => setIsCategoryMenuOpen(prev => !prev)}
          className={`h-9 px-3 rounded-[10px] flex items-center justify-center transition-colors cursor-pointer ${
            selectedCategory !== 'all' || isCategoryMenuOpen
              ? 'bg-[#007AFF] text-white'
              : 'bg-[#767680]/12 text-black hover:bg-[#767680]/18'
          }`}
          title="Категории"
        >
          <SlidersHorizontal className="w-4 h-4" />
        </button>

        {/* Add Task Button */}
        <button
          type="button"
          onClick={() => setIsCreateModalOpen(true)}
          className="h-9 px-3 bg-[#007AFF] hover:bg-[#007AFF]/90 text-white rounded-[10px] text-[13px] font-semibold flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Задача</span>
        </button>

        {/* Categories Dropdown Menu */}
        {isCategoryMenuOpen && (
          <div className="absolute right-12 top-11 z-30 bg-white rounded-[14px] shadow-xl border border-black/5 py-1.5 w-44 divide-y divide-[#C6C6C8]/30 animate-in fade-in">
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('all');
                setIsCategoryMenuOpen(false);
              }}
              className="w-full px-3.5 py-2 text-left text-[14px] flex items-center justify-between hover:bg-[#767680]/10 transition-colors cursor-pointer"
            >
              <span className={selectedCategory === 'all' ? 'font-semibold text-black' : 'text-black'}>
                Все категории
              </span>
              {selectedCategory === 'all' && <Check className="w-4 h-4 text-[#007AFF]" />}
            </button>
            {availableCategories.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  setSelectedCategory(cat);
                  setIsCategoryMenuOpen(false);
                }}
                className="w-full px-3.5 py-2 text-left text-[14px] flex items-center justify-between hover:bg-[#767680]/10 transition-colors cursor-pointer"
              >
                <span className={selectedCategory === cat ? 'font-semibold text-black' : 'text-black'}>
                  {cat}
                </span>
                {selectedCategory === cat && <Check className="w-4 h-4 text-[#007AFF]" />}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* iOS Segmented Control: strictly 2 states [ Активные | Завершенные ] on 100% width */}
      <div className="bg-[#767680]/12 p-0.5 rounded-[9px] w-full grid grid-cols-2 select-none">
        <button
          type="button"
          onClick={() => setSelectedStatus('active')}
          className={`py-1.5 text-[13px] font-medium rounded-[7px] text-center transition-all cursor-pointer ${
            selectedStatus === 'active'
              ? 'bg-white text-black shadow-xs font-semibold'
              : 'text-[#8E8E93] hover:text-black'
          }`}
        >
          Активные ({activeCount})
        </button>
        <button
          type="button"
          onClick={() => setSelectedStatus('done')}
          className={`py-1.5 text-[13px] font-medium rounded-[7px] text-center transition-all cursor-pointer ${
            selectedStatus === 'done'
              ? 'bg-white text-black shadow-xs font-semibold'
              : 'text-[#8E8E93] hover:text-black'
          }`}
        >
          Завершенные ({doneCount})
        </button>
      </div>

      {/* Section Header */}
      <div className="flex items-center justify-between ml-4 mr-2">
        <h4 className="text-[13px] font-normal text-[#8E8E93] uppercase tracking-wider">
          Напоминания ({filteredTasks.length})
        </h4>
        <button
          type="button"
          onClick={() => setIsCreateModalOpen(true)}
          className="text-[13px] text-[#007AFF] font-medium flex items-center gap-1 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Новая задача</span>
        </button>
      </div>

      {/* Reminders List (iOS Inset Grouped) */}
      <div className="bg-white rounded-[16px] divide-y divide-[#C6C6C8]/40 overflow-hidden">
        {filteredTasks.length === 0 ? (
          <div className="p-8 text-center text-[#8E8E93]">
            <p className="text-[15px] font-medium text-black">Задач нет</p>
          </div>
        ) : (
          filteredTasks.map(task => {
            const subtasks = task.subtasks || [];
            const isExpanded = !!expandedTaskIds[task.id];
            const isDone = task.nonContentStatus === 'done';
            const isInProgress = task.nonContentStatus === 'in_progress';
            const doneSubtasks = subtasks.filter(s => s.status === 'done').length;
            const totalSubtasks = subtasks.length;

            const defaultAssigneeName = currentProject?.members?.[0]?.name || chatUsers[0]?.name || 'Кирилл';
            const inputState = newSubtaskInputs[task.id] || { 
              title: '', 
              assignedTo: defaultAssigneeName, 
              assignedAvatar: chatUsers[0]?.avatar || '' 
            };

            return (
              <div key={task.id} className="transition-colors">
                {/* Main Task Row */}
                <div className="px-4 py-3.5 flex items-start gap-3">
                  {/* Native Circular Checkbox */}
                  <button
                    type="button"
                    onClick={() => toggleNonContentTaskStatus(task.id)}
                    className={`w-5 h-5 rounded-full mt-0.5 flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                      isDone
                        ? 'bg-[#34C759] text-white'
                        : isInProgress
                        ? 'border-2 border-[#007AFF] text-[#007AFF]'
                        : 'border-2 border-[#C6C6C8] hover:border-[#007AFF]'
                    }`}
                  >
                    {isDone && <Check className="w-3 h-3 stroke-[3]" />}
                    {isInProgress && <div className="w-2 h-2 rounded-full bg-[#007AFF]" />}
                  </button>

                  {/* Task Content */}
                  <div className="flex-1 min-w-0" onClick={() => subtasks.length > 0 && toggleExpand(task.id)}>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[16px] font-medium tracking-tight ${isDone ? 'line-through text-[#8E8E93]' : 'text-black'}`}>
                        {task.title}
                      </span>
                    </div>

                    {task.description && (
                      <p className="text-[13px] text-[#8E8E93] mt-0.5 line-clamp-1">
                        {task.description}
                      </p>
                    )}

                    {/* Metadata chips */}
                    <div className="flex items-center gap-2 mt-1 flex-wrap text-[12px]">
                      {task.nonContentCategory && (
                        <span className="text-[#007AFF] font-medium">
                          {task.nonContentCategory}
                        </span>
                      )}
                      {task.targetDueDate && (
                        <span className="text-[#8E8E93] flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{task.targetDueDate}</span>
                        </span>
                      )}
                      {totalSubtasks > 0 && (
                        <span className="text-[#8E8E93]">
                          {doneSubtasks} из {totalSubtasks}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right: Subtasks Chevron */}
                  <div className="flex items-center gap-2 shrink-0 self-center">
                    {task.ownerAvatar && (
                      <img 
                        src={task.ownerAvatar} 
                        alt="" 
                        className="w-6 h-6 rounded-full object-cover" 
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => toggleExpand(task.id)}
                      className="p-1 text-[#8E8E93] hover:text-black cursor-pointer transition-transform"
                    >
                      <ChevronRight className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-90 text-[#007AFF]' : ''}`} />
                    </button>
                  </div>
                </div>

                {/* Subtasks Expanded Container */}
                {isExpanded && (
                  <div className="pl-12 pr-4 pb-3 space-y-2 bg-[#F2F2F7]/40 border-t border-[#C6C6C8]/20">
                    {/* Subtask rows */}
                    <div className="space-y-1.5 pt-2">
                      {subtasks.map(st => (
                        <div key={st.id} className="py-1.5 px-2 bg-white/70 hover:bg-white rounded-[10px] border border-black/5 flex items-center justify-between gap-2.5 transition-colors">
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <button
                              type="button"
                              onClick={() => {
                                const nextStatus = st.status === 'done' ? 'todo' : 'done';
                                updateSubtaskStatus(task.id, st.id, nextStatus);
                              }}
                              className={`w-4.5 h-4.5 rounded-[5px] border flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                                st.status === 'done'
                                  ? 'bg-[#34C759] border-[#34C759] text-white'
                                  : st.status === 'in_progress'
                                  ? 'bg-[#FF9500] border-[#FF9500] text-white'
                                  : 'border-[#C6C6C8] bg-white hover:border-[#007AFF]'
                              }`}
                              title={st.status === 'done' ? 'Выполнено (нажмите для отмены)' : 'Отметить как выполненное'}
                            >
                              {st.status === 'done' && <Check className="w-3 h-3 stroke-[3]" />}
                              {st.status === 'in_progress' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                            </button>
                            <span 
                              onClick={() => {
                                const nextStatus = st.status === 'done' ? 'todo' : 'done';
                                updateSubtaskStatus(task.id, st.id, nextStatus);
                              }}
                              className={`text-[13.5px] truncate cursor-pointer select-none transition-colors ${
                                st.status === 'done' ? 'line-through text-[#8E8E93]' : 'text-black'
                              }`}
                            >
                              {st.title}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <select
                              value={st.status}
                              onChange={(e) => updateSubtaskStatus(task.id, st.id, e.target.value as 'todo' | 'in_progress' | 'done')}
                              className={`text-[11px] font-medium px-2 py-0.5 rounded-[6px] border border-transparent cursor-pointer focus:outline-none transition-colors ${
                                st.status === 'done'
                                  ? 'bg-[#34C759]/15 text-[#34C759]'
                                  : st.status === 'in_progress'
                                  ? 'bg-[#FF9500]/15 text-[#FF9500]'
                                  : 'bg-[#767680]/12 text-[#8E8E93]'
                              }`}
                            >
                              <option value="todo">Сделать</option>
                              <option value="in_progress">В работе</option>
                              <option value="done">Готово</option>
                            </select>

                            {st.assignedAvatar && (
                              <img src={st.assignedAvatar} alt="" className="w-5 h-5 rounded-full object-cover" />
                            )}
                            <button
                              type="button"
                              onClick={() => deleteSubtask(task.id, st.id)}
                              className="text-[#8E8E93] hover:text-[#FF3B30] p-1 cursor-pointer transition-colors"
                              title="Удалить подзадачу"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Add Subtask Inline Input */}
                    <div className="pt-2 flex items-center gap-2">
                      <input
                        type="text"
                        dir="ltr"
                        value={inputState.title}
                        onChange={(e) => setNewSubtaskInputs(prev => ({
                          ...prev,
                          [task.id]: { ...inputState, title: e.target.value }
                        }))}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddSubtask(task.id);
                          }
                        }}
                        placeholder="Новая подзадача"
                        className="flex-1 text-[13px] bg-white border border-[#C6C6C8]/60 rounded-[8px] px-2.5 py-1 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddSubtask(task.id)}
                        className="text-[13px] text-[#007AFF] font-semibold px-2 py-1 cursor-pointer"
                      >
                        Добавить
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Create Task Modal */}
      {isCreateModalOpen && (
        <CreateTaskModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
        />
      )}
    </div>
  );
};

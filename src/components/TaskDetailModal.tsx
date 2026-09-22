import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useProduction } from '../context/ProductionContext';
import { TaskCard, ChecklistStatus, PlacementType, getTaskStage, KanbanColumnId } from '../types';
import { VoiceNotePlayer } from './VoiceNotePlayer';
import { 
  X, 
  ChevronRight, 
  ChevronDown,
  ExternalLink, 
  FileText, 
  Edit3, 
  Check, 
  Trash2, 
  Clock, 
  Film, 
  Video, 
  Upload, 
  Calendar, 
  FolderPlus,
  Play,
  CheckCircle2,
  AlertCircle,
  Share2,
  Send,
  MessageSquare,
  Mic,
  Paperclip,
  HelpCircle,
  Info,
  Sparkles,
  Plus,
  Bold,
  Italic,
  List,
  Quote,
  Lock,
  Folder
} from 'lucide-react';

export const TaskDetailModal: React.FC = () => {
  const { 
    tasks, 
    selectedTaskId, 
    setSelectedTaskId, 
    setEditingScriptTaskId, 
    currentRole,
    activeRole,
    updateTaskDetails,
    archiveTask,
    addFootagePool,
    appendIdeaSupplement,
    submitRender,
    attachRenderFromChat,
    attachCover,
    reviewRender,
    setPlacement,
    promoteTrialToMain,
    scheduleShooting,
    moveTaskToStage
  } = useProduction();

  const [isEditMode, setIsEditMode] = useState(false);
  const [isScriptReaderOpen, setIsScriptReaderOpen] = useState(false);
  const [isSimulatePoolOpen, setIsSimulatePoolOpen] = useState(false);
  const [simulateFilesCount, setSimulateFilesCount] = useState(4);
  const [simulatePoolNote, setSimulatePoolNote] = useState('');

  // Supplement state (войсы, видео к идее)
  const [isAddSupplementOpen, setIsAddSupplementOpen] = useState(false);
  const [supplementType, setSupplementType] = useState<'voice' | 'video' | 'text'>('voice');
  const [supplementNote, setSupplementNote] = useState('');

  // Attach render state
  const [isAttachRenderOpen, setIsAttachRenderOpen] = useState(false);
  const [renderUrlInput, setRenderUrlInput] = useState('');
  const [renderNoteInput, setRenderNoteInput] = useState('Черновой монтаж v1 с субтитрами');

  // Attach cover separate state
  const [isAttachCoverOpen, setIsAttachCoverOpen] = useState(false);
  const [coverUrlInput, setCoverUrlInput] = useState('');

  // Spoiler for Material Pools hint
  const [isPoolsSpoilerOpen, setIsPoolsSpoilerOpen] = useState(false);

  // Selected task
  const task = tasks.find(t => t.id === selectedTaskId);

  // Editable fields
  const [taskTitleInput, setTaskTitleInput] = useState(task?.title || '');
  const [ideaDescInput, setIdeaDescInput] = useState(task?.ideaDescription || '');
  const [shootingDateInput, setShootingDateInput] = useState(task?.shootingDate || '');
  const [isIdeaSaved, setIsIdeaSaved] = useState(false);
  const [isShootingSaved, setIsShootingSaved] = useState(false);

  useEffect(() => {
    if (task) {
      setTaskTitleInput(task.title);
      setIdeaDescInput(task.ideaDescription || '');
      setShootingDateInput(task.shootingDate || '');
      setIsIdeaSaved(false);
      setIsShootingSaved(false);
    }
  }, [task?.id, task?.title, task?.ideaDescription, task?.shootingDate]);

  if (!task) return null;

  const currentStage = getTaskStage(task);
  const isInDevelopment = currentStage === 'development';

  const stageLabels: Record<KanbanColumnId, string> = {
    idea: 'Идеи',
    script: 'Сценарий',
    shooting: 'Съемка',
    development: 'В разработке',
    delivered: 'Сдан',
  };

  const canEdit = activeRole === 'super_admin' || activeRole === 'publisher';
  const canAddMaterials = activeRole === 'expert' || activeRole === 'publisher' || activeRole === 'super_admin';
  const canAttachRender = activeRole === 'editor' || activeRole === 'designer' || activeRole === 'super_admin';

  // Save idea description handler
  const handleSaveIdeaDesc = () => {
    updateTaskDetails(task.id, { ideaDescription: ideaDescInput.trim() });
    setIsIdeaSaved(true);
    setTimeout(() => setIsIdeaSaved(false), 2000);
  };

  // Helper for quick formatting in idea description
  const handleInsertFormatting = (syntax: string) => {
    if (syntax === 'bold') {
      setIdeaDescInput(prev => prev + ' **жирный текст**');
    } else if (syntax === 'italic') {
      setIdeaDescInput(prev => prev + ' *курсив*');
    } else if (syntax === 'list') {
      setIdeaDescInput(prev => prev + '\n- Пункт 1\n- Пункт 2');
    } else if (syntax === 'quote') {
      setIdeaDescInput(prev => prev + '\n> Цитата или инсайт');
    }
  };

  const isScriptWritten = Boolean(task.scriptText && task.scriptText.trim().length > 0);

  // Save shooting date handler (Назначить съёмку можно только после того как сценарий будет написан)
  const handleSaveShootingDate = (dateVal?: string) => {
    if (!isScriptWritten) {
      alert('Назначить съёмку можно только после того, как сценарий будет написан.');
      return;
    }
    const val = dateVal !== undefined ? dateVal : shootingDateInput;
    if (!val.trim()) return;
    scheduleShooting(task.id, val.trim());
    setIsShootingSaved(true);
    setTimeout(() => setIsShootingSaved(false), 2000);
  };

  const handleSimulateFootagePool = (e: React.FormEvent) => {
    e.preventDefault();
    addFootagePool(task.id, Number(simulateFilesCount), simulatePoolNote);
    setIsSimulatePoolOpen(false);
    setSimulatePoolNote('');
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 my-auto flex flex-col max-h-[90vh]">
        
        {/* Header: #ID + Формат + Колонка + Редактируемое название */}
        <div className="p-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white flex items-start justify-between gap-3 shrink-0">
          <div className="space-y-2 flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono font-bold text-xs bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-300">
                #{task.id}
              </span>
              
              <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                task.type === 'reels'
                  ? 'bg-purple-50 text-purple-700 border-purple-200'
                  : task.type === 'carousel'
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : 'bg-orange-50 text-orange-700 border-orange-200'
              }`}>
                {task.type === 'reels' ? 'Reels' : task.type === 'carousel' ? 'Карусель' : 'Stories'}
              </span>

              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                Колонка: {stageLabels[currentStage]}
              </span>

              {(task.firstMaterialMsgLink || task.telegramTopicMsgLink) && (
                <a
                  href={task.firstMaterialMsgLink || task.telegramTopicMsgLink}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200 hover:bg-sky-100 transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>В Telegram</span>
                </a>
              )}

              {task.kind !== 'non_content' && task.placement === 'trial' && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-800 border border-cyan-200">
                  В пробных (48ч тест)
                </span>
              )}
            </div>

            {/* Название задачи */}
            <div className="pt-0.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Название задачи:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={taskTitleInput}
                  onChange={(e) => setTaskTitleInput(e.target.value)}
                  onBlur={() => {
                    if (taskTitleInput.trim() && taskTitleInput !== task.title) {
                      updateTaskDetails(task.id, { title: taskTitleInput.trim() });
                    }
                  }}
                  className="w-full text-base sm:text-lg font-bold text-slate-900 bg-white hover:bg-slate-50 focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-lg px-2.5 py-1 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all leading-snug"
                  placeholder="Введите название задачи..."
                />
                {taskTitleInput !== task.title && (
                  <button
                    type="button"
                    onClick={() => {
                      if (taskTitleInput.trim()) {
                        updateTaskDetails(task.id, { title: taskTitleInput.trim() });
                      }
                    }}
                    className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors shrink-0 cursor-pointer shadow-2xs"
                  >
                    Сохранить
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {/* Edit toggle button for Admin & Publisher */}
            {canEdit && (
              <button
                onClick={() => setIsEditMode(!isEditMode)}
                className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
                  isEditMode 
                    ? 'bg-indigo-600 text-white shadow-xs' 
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
                title="Режим ручного редактирования полей"
              >
                <Edit3 className="w-4 h-4" />
                <span className="hidden sm:inline">{isEditMode ? 'Готово' : 'Редактировать'}</span>
              </button>
            )}

            <button
              onClick={() => setSelectedTaskId(null)}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body: Progressive Disclosure based on Kanban Stage */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto min-h-0 flex-1">

          {/* ========================================================================= */}
          {/* STAGE 1: ИДЕЯ (CURRENT STAGE === 'idea') */}
          {/* ========================================================================= */}
          {currentStage === 'idea' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Опишите идею (rich text) - это то, что берется из чата */}
              <div className="bg-amber-50/50 border border-amber-200/80 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    <span className="text-xs font-bold text-amber-950 uppercase tracking-wider">
                      Опишите идею (rich text) — это то, что берётся из чата
                    </span>
                  </div>
                  {isIdeaSaved && (
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Сохранено
                    </span>
                  )}
                </div>

                {/* Quick rich-text toolbar */}
                <div className="flex items-center gap-1.5 border-b border-amber-200/60 pb-2">
                  <button
                    type="button"
                    onClick={() => handleInsertFormatting('bold')}
                    className="p-1.5 rounded hover:bg-amber-100 text-amber-800 text-xs font-bold transition-colors"
                    title="Жирный шрифт"
                  >
                    <Bold className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInsertFormatting('italic')}
                    className="p-1.5 rounded hover:bg-amber-100 text-amber-800 text-xs transition-colors"
                    title="Курсив"
                  >
                    <Italic className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInsertFormatting('list')}
                    className="p-1.5 rounded hover:bg-amber-100 text-amber-800 text-xs transition-colors"
                    title="Список"
                  >
                    <List className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInsertFormatting('quote')}
                    className="p-1.5 rounded hover:bg-amber-100 text-amber-800 text-xs transition-colors"
                    title="Цитата"
                  >
                    <Quote className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[11px] text-amber-700/70 ml-auto">
                    Синхронизировано с топиком «Идеи»
                  </span>
                </div>

                {/* Textarea for rich-text idea description */}
                <textarea
                  value={ideaDescInput}
                  onChange={(e) => setIdeaDescInput(e.target.value)}
                  onBlur={handleSaveIdeaDesc}
                  rows={5}
                  placeholder="Опишите суть идеи, хук, ключевой тезис или тему ролика, зафиксированную из обсуждения в чате..."
                  className="w-full p-3 text-xs sm:text-sm text-slate-800 bg-white border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none transition-all placeholder:text-slate-400"
                />

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-slate-500">
                    {ideaDescInput.length} символов
                  </span>
                  <button
                    type="button"
                    onClick={handleSaveIdeaDesc}
                    className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Сохранить описание идеи</span>
                  </button>
                </div>
              </div>

              {/* Voice Notes (Голосовые сообщения) */}
              {task.voiceNotes && task.voiceNotes.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                    <Mic className="w-4 h-4 text-[#007AFF]" />
                    <span>Голосовые заметки ({task.voiceNotes.length}):</span>
                  </div>
                  <div className="space-y-2">
                    {task.voiceNotes.map(vn => (
                      <VoiceNotePlayer key={vn.id} voice={vn} />
                    ))}
                  </div>
                </div>
              )}

              {/* References (YouTube Shorts / Instagram Reels) */}
              {task.references && task.references.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                    <Share2 className="w-4 h-4 text-purple-600" />
                    <span>Референсы и примеры ({task.references.length}):</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {task.references.map(ref => (
                      <a
                        key={ref.id}
                        href={ref.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-between p-2.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors text-xs font-medium text-slate-800 shadow-2xs group"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold shrink-0 ${
                            ref.platform === 'youtube' ? 'bg-red-100 text-red-700' :
                            ref.platform === 'instagram' ? 'bg-purple-100 text-purple-700' :
                            'bg-slate-100 text-slate-700'
                          }`}>
                            {ref.platform === 'youtube' ? 'Shorts' : ref.platform === 'instagram' ? 'Reels' : 'Ссылка'}
                          </span>
                          <span className="truncate">{ref.title || ref.url}</span>
                        </div>
                        <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 shrink-0 ml-1.5" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Supplements from chat (войсы, видео, референсы) */}
              <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Paperclip className="w-4 h-4 text-slate-700" />
                    <span className="text-xs font-bold text-slate-800">
                      Вложения из чата: <span className="font-mono">{task.supplements?.length || 0}</span>
                    </span>
                  </div>
                  <button
                    onClick={() => setIsAddSupplementOpen(true)}
                    className="flex items-center gap-1 text-[11px] font-bold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 px-2.5 py-1 rounded-lg transition-colors border border-slate-200 cursor-pointer shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Дополнить идею (войс/видео)</span>
                  </button>
                </div>

                {task.supplements && task.supplements.length > 0 ? (
                  <div className="space-y-1.5 pt-1">
                    {task.supplements.map(supp => (
                      <div
                        key={supp.id}
                        className="bg-white p-2.5 rounded-lg border border-slate-200 flex items-center justify-between gap-2 shadow-2xs"
                      >
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-900 truncate flex items-center gap-1.5">
                            <span>
                              {supp.type === 'voice' ? (
                                <Mic className="w-3.5 h-3.5 text-amber-600 inline" />
                              ) : supp.type === 'video' ? (
                                <Video className="w-3.5 h-3.5 text-purple-600 inline" />
                              ) : (
                                <FileText className="w-3.5 h-3.5 text-blue-600 inline" />
                              )}
                            </span>
                            <span>{supp.title}</span>
                          </div>
                          {supp.note && (
                            <div className="text-[11px] text-slate-600 line-clamp-1 mt-0.5">
                              {supp.note}
                            </div>
                          )}
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            Добавлено в {supp.addedAt}
                          </div>
                        </div>

                        <a
                          href={supp.telegramLink || 'https://t.me'}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-md border border-slate-200 transition-colors shrink-0"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>В чате</span>
                        </a>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-500">
                    К этой идее пока нет голосовых заметок или видео-референсов. Вы можете дослать их кнопкой выше или через бота в чате.
                  </p>
                )}
              </div>

              {/* Requirement: Когда идея создана, внутри должна быть кнопка: напишите сценарий или допишите сценарий, если есть черновик */}
              <div className="p-4 bg-gradient-to-r from-indigo-50 via-purple-50 to-indigo-50 border-2 border-indigo-200 rounded-2xl space-y-2.5 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-indigo-600" />
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">
                        {task.scriptText ? 'Сценарий в работе' : 'Переход к сценарию'}
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        {task.scriptText 
                          ? 'Для этой идеи уже сохранен черновик текста'
                          : 'Идея зафиксирована и готова к написанию сценария'}
                      </p>
                    </div>
                  </div>
                  {task.scriptText && (
                    <span className="text-[11px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full">
                      Черновик сохранен
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedTaskId(null);
                    setEditingScriptTaskId(task.id);
                  }}
                  className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.005]"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>
                    {task.scriptText ? 'Допишите сценарий (есть черновик)' : 'Напишите сценарий'}
                  </span>
                  <ChevronRight className="w-4 h-4 ml-1" />
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STAGE 2: СЦЕНАРИЙ (CURRENT STAGE === 'script') */}
          {/* ========================================================================= */}
          {currentStage === 'script' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Ссылка на идею */}
              {task.ideaDescription && (
                <div className="bg-amber-50/60 border border-amber-200/80 rounded-xl p-3 text-xs text-amber-950">
                  <span className="font-bold block mb-0.5 text-amber-900">Исходная идея из чата:</span>
                  <p className="line-clamp-3 text-slate-700">{task.ideaDescription}</p>
                </div>
              )}

              {/* Сценарий ролика */}
              <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-600" />
                    <div>
                      <div className="text-xs font-bold text-slate-800">Сценарий ролика</div>
                      <div className="text-[11px] text-slate-500">
                        {task.scriptStatus === 'green' ? 'Сценарий утвержден экспертом' : 'Черновик сценария в работе'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {task.scriptText && (
                      <button
                        onClick={() => setIsScriptReaderOpen(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-800 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5 text-indigo-600 fill-indigo-600" />
                        <span>Показать сценарий</span>
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setSelectedTaskId(null);
                        setEditingScriptTaskId(task.id);
                      }}
                      className="px-3.5 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-colors shadow-2xs flex items-center gap-1 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>{task.scriptText ? 'Дописать сценарий' : 'Написать сценарий'}</span>
                    </button>
                  </div>
                </div>

                {task.scriptText && (
                  <div className="p-3 bg-white rounded-lg border border-slate-200 text-xs text-slate-700 font-mono line-clamp-3 whitespace-pre-wrap">
                    {task.scriptText}
                  </div>
                )}
              </div>

              {/* Requirement: Назначить съёмку можно только после того как сценарий будет написан */}
              {!isScriptWritten ? (
                <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center shrink-0">
                        <Lock className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-800">
                          Назначение съёмки заблокировано
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Назначить съёмку можно только после того, как сценарий будет написан.
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-amber-800 bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-full shrink-0">
                      Сначала сценарий
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTaskId(null);
                      setEditingScriptTaskId(task.id);
                    }}
                    className="w-full py-2.5 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Написать сценарий для разблокировки съёмки</span>
                  </button>
                </div>
              ) : (
                <div className="bg-rose-50/60 border border-rose-200/80 rounded-xl p-3.5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-rose-600" />
                      <span className="text-xs font-bold text-rose-950 uppercase tracking-wider">
                        Назначить съёмку
                      </span>
                    </div>
                    {isShootingSaved && (
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Дата съёмки сохранена
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-rose-900/80">
                    Сценарий написан! Зафиксируйте дату и время съёмки, чтобы забронировать слот в календаре и уведомить команду.
                  </p>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <input
                      type="text"
                      value={shootingDateInput}
                      onChange={(e) => setShootingDateInput(e.target.value)}
                      placeholder="Например: 2026-09-23 15:00"
                      className="flex-1 px-3 py-1.5 text-xs bg-white border border-rose-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleSaveShootingDate()}
                      className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg transition-colors shadow-2xs shrink-0 cursor-pointer flex items-center justify-center gap-1"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Зафиксировать дату</span>
                    </button>
                  </div>

                  {/* Quick preset chips */}
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    <span className="text-[10px] text-slate-500 font-semibold">Быстрый выбор:</span>
                    <button
                      type="button"
                      onClick={() => {
                        const d = '2026-09-22 14:00';
                        setShootingDateInput(d);
                        handleSaveShootingDate(d);
                      }}
                      className="px-2 py-0.5 rounded bg-white hover:bg-rose-100 text-rose-800 border border-rose-200 text-[10px] font-medium transition-colors cursor-pointer"
                    >
                      Вторник 14:00
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const d = '2026-09-23 15:00';
                        setShootingDateInput(d);
                        handleSaveShootingDate(d);
                      }}
                      className="px-2 py-0.5 rounded bg-white hover:bg-rose-100 text-rose-800 border border-rose-200 text-[10px] font-medium transition-colors cursor-pointer"
                    >
                      Среда 15:00
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const d = '2026-09-24 12:00';
                        setShootingDateInput(d);
                        handleSaveShootingDate(d);
                      }}
                      className="px-2 py-0.5 rounded bg-white hover:bg-rose-100 text-rose-800 border border-rose-200 text-[10px] font-medium transition-colors cursor-pointer"
                    >
                      Четверг 12:00
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* STAGE 3: СЪЁМКА (CURRENT STAGE === 'shooting') */}
          {/* ========================================================================= */}
          {currentStage === 'shooting' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Сценарий ролика (для съемки) */}
              <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-600" />
                  <div>
                    <div className="text-xs font-bold text-slate-800">Сценарий ролика</div>
                    <div className="text-[11px] text-slate-500">Текст утвержден для проведения съемки</div>
                  </div>
                </div>
                {task.scriptText && (
                  <button
                    onClick={() => setIsScriptReaderOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-800 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 text-indigo-600 fill-indigo-600" />
                    <span>Показать сценарий</span>
                  </button>
                )}
              </div>

              {/* Requirement: Съёмку я должен иметь возможность назначить / изменить */}
              <div className="bg-rose-50/70 border border-rose-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Video className="w-4 h-4 text-rose-600" />
                    <span className="text-xs font-bold text-rose-950 uppercase tracking-wider">
                      Блок съёмки
                    </span>
                  </div>
                  {isShootingSaved && (
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Дата сохранена
                    </span>
                  )}
                </div>

                {/* Назначить / скорректировать дату съемки */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-semibold text-slate-700">
                    Назначенная дата съёмки:
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={shootingDateInput}
                      onChange={(e) => setShootingDateInput(e.target.value)}
                      placeholder="2026-09-23 15:00"
                      className="flex-1 px-3 py-1.5 text-xs bg-white border border-rose-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleSaveShootingDate()}
                      className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg transition-colors shadow-2xs shrink-0 cursor-pointer"
                    >
                      Сохранить дату
                    </button>
                  </div>
                </div>

                {/* Чекбокс отметки: снято */}
                <div className="pt-2 border-t border-rose-200/60 flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={task.shootingStatus === 'green'}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        updateTaskDetails(task.id, {
                          shootingStatus: checked ? 'green' : (task.shootingDate ? 'yellow' : 'gray')
                        });
                      }}
                      className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-800">
                        Отметка: снято
                      </span>
                      <p className="text-[11px] text-slate-500">
                        Поставьте отметку, когда оператор и эксперт закончили запись дублей
                      </p>
                    </div>
                  </label>
                  {task.shootingStatus === 'green' && (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                      Снято
                    </span>
                  )}
                </div>

                {/* Загрузка первых материалов / Пул 1 */}
                <div className="pt-2 border-t border-rose-200/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div className="text-[11px] text-slate-600">
                    Съёмка завершена? Примите файлы дублей (Пул 1), чтобы перевести карточку на монтаж.
                  </div>
                  <div className="flex items-center gap-2">
                    {(task.firstMaterialMsgLink || task.telegramTopicMsgLink) && (
                      <a
                        href={task.firstMaterialMsgLink || task.telegramTopicMsgLink}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 text-xs font-bold rounded-lg transition-colors shadow-2xs shrink-0 cursor-pointer flex items-center gap-1.5"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Открыть в Telegram</span>
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => setIsSimulatePoolOpen(true)}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors shadow-2xs shrink-0 cursor-pointer flex items-center gap-1.5"
                    >
                      <FolderPlus className="w-3.5 h-3.5" />
                      <span>Принять Пул 1 и начать монтаж</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STAGE 4: В РАЗРАБОТКЕ / МОНТАЖ (CURRENT STAGE === 'development') */}
          {/* ========================================================================= */}
          {currentStage === 'development' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Сценарий (свернутый просмотр) */}
              <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-600" />
                  <span className="text-xs font-bold text-slate-800">Сценарий ролика:</span>
                  <span className="text-xs text-slate-500 truncate max-w-[260px]">{task.title}</span>
                </div>
                {task.scriptText && (
                  <button
                    onClick={() => setIsScriptReaderOpen(true)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <Play className="w-3 h-3 text-indigo-600" />
                    <span>Текст</span>
                  </button>
                )}
              </div>

              {/* Съёмка (информация о дате и возможность скорректировать) */}
              <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Video className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-bold text-slate-800">Съёмка:</span>
                  <span className="text-xs text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Снято ({task.shootingDate || 'Дата зафиксирована'})
                  </span>
                </div>
                <button
                  onClick={() => {
                    const newD = prompt('Изменить дату съемки:', task.shootingDate || '');
                    if (newD) handleSaveShootingDate(newD);
                  }}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
                >
                  Изменить дату
                </button>
              </div>

              {/* Requirement: Исходные материалы + СПОЙЛЕР «Как работает система Пулов материалов» */}
              <div className="bg-slate-50/80 border border-slate-200/90 rounded-xl p-3.5 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Film className="w-4 h-4 text-slate-700" />
                    <span className="text-xs font-bold text-slate-900">
                      Исходные материалы: <span className="font-mono text-indigo-600 font-extrabold">{task.materialsTotalCount}</span> файлов ({task.pools.length} пул)
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {(task.firstMaterialMsgLink || task.telegramTopicMsgLink) && (
                      <a
                        href={task.firstMaterialMsgLink || task.telegramTopicMsgLink}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 text-[11px] font-bold text-sky-700 bg-sky-50 hover:bg-sky-100 px-2.5 py-1 rounded-lg border border-sky-200 transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>📁 Открыть материалы в Telegram</span>
                      </a>
                    )}
                    {canAddMaterials && (
                      <button
                        onClick={() => setIsSimulatePoolOpen(true)}
                        className="flex items-center gap-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg border border-indigo-200 transition-colors cursor-pointer"
                      >
                        <FolderPlus className="w-3.5 h-3.5" />
                        <span>+ Дослать материалы (Пул {task.pools.length + 1})</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Requirement: скрыть подсказку за спойлером: «Как работает система «Пулов материалов» */}
                <div className="border border-indigo-200/80 rounded-lg overflow-hidden bg-indigo-50/50">
                  <button
                    type="button"
                    onClick={() => setIsPoolsSpoilerOpen(!isPoolsSpoilerOpen)}
                    className="w-full p-2.5 flex items-center justify-between text-left text-xs font-bold text-indigo-950 hover:bg-indigo-100/50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-1.5">
                      <HelpCircle className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      <span>Как работает система «Пулов материалов»</span>
                    </div>
                    {isPoolsSpoilerOpen ? (
                      <ChevronDown className="w-4 h-4 text-indigo-600 transition-transform" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-indigo-600 transition-transform" />
                    )}
                  </button>

                  {isPoolsSpoilerOpen && (
                    <div className="p-3 pt-1 text-xs text-indigo-950/90 border-t border-indigo-100 space-y-1.5 animate-in fade-in">
                      <p className="text-[11px] leading-relaxed">
                        • <strong>Пул 1</strong> создается автоматически, когда эксперт или оператор впервые скидывает дубли съемки в топик «Съемка/Материалы». Карточка переходит в статус <em>«Монтаж»</em>.
                      </p>
                      <p className="text-[11px] leading-relaxed">
                        • <strong>Пул 2, 3... («Дослать материалы»)</strong> — если после съемки потребовалось дослать перебивки, b-roll, звук или переснятый дубль хука. При отправке новой пачки файлов они не теряются, а оформляются в отдельный нумерованный Пул с прямой ссылкой на сообщение в чате.
                      </p>
                    </div>
                  )}
                </div>

                {/* List of direct pool links */}
                <div className="space-y-1.5">
                  {task.pools.length === 0 ? (
                    <div className="text-xs text-slate-400 py-3 text-center bg-white rounded-lg border border-dashed border-slate-200">
                      Исходники пока не залиты. Нажмите «+ Дослать материалы» или отправьте файлы боту в топике «Съемка/Материалы».
                    </div>
                  ) : (
                    task.pools.map(pool => (
                      <div
                        key={pool.id}
                        className="bg-white p-2.5 rounded-lg border border-slate-200/90 flex items-center justify-between gap-2 shadow-2xs"
                      >
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-900 truncate flex items-center gap-1.5">
                            <Folder className="w-3.5 h-3.5 text-slate-500 inline" />
                            <span>{pool.name}</span>
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            Загружено {pool.uploadedAt} {pool.note ? `· ${pool.note}` : ''}
                          </div>
                        </div>

                        <a
                          href={pool.telegramChatLink}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold bg-sky-50 text-sky-700 hover:bg-sky-100 rounded-md border border-sky-200 transition-colors shrink-0"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>В чат к сообщению</span>
                        </a>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Requirement: Монтаж и сдача рендера */}
              <div className="p-3.5 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-purple-950 flex items-center gap-1.5">
                    <Video className="w-4 h-4 text-purple-600" />
                    <span>Монтаж и сдача рендера:</span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-300">
                    В разработке
                  </span>
                </div>

                {canAttachRender ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    <button
                      onClick={() => setIsAttachRenderOpen(true)}
                      className="w-full py-2 px-3 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-lg transition-all shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Video className="w-4 h-4" />
                      <span>Прикрепить рендер (/render)</span>
                    </button>
                    <button
                      onClick={() => setIsAttachCoverOpen(true)}
                      className="w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-all shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Upload className="w-4 h-4" />
                      <span>Добавить обложку (/cover)</span>
                    </button>
                  </div>
                ) : (
                  <div className="text-[11px] text-purple-900/80 bg-white/70 p-2.5 rounded-lg border border-purple-200">
                    Прикрепление файлов рендера и обложки доступно монтажёру и дизайнеру.
                  </div>
                )}

                {task.renderUrl && (
                  <div className="text-[11px] text-purple-900 bg-white/80 p-2 rounded-lg border border-purple-200 flex items-center justify-between">
                    <span className="truncate mr-2">Рендер: <strong>{task.renderUrl}</strong></span>
                    <span className="font-semibold text-emerald-700 shrink-0">Готов к проверке</span>
                  </div>
                )}

                {task.coverUrl && (
                  <div className="text-[11px] text-indigo-900 bg-white/80 p-2 rounded-lg border border-indigo-200 flex items-center justify-between">
                    <span className="truncate mr-2">Обложка: <strong>{task.coverUrl}</strong></span>
                    <span className="font-semibold text-emerald-700 shrink-0">Загружена</span>
                  </div>
                )}

                {/* Кнопка сдать готовую работу */}
                {(activeRole === 'editor' || activeRole === 'designer' || activeRole === 'super_admin') && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2 mt-2">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Сдать готовую работу:</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        moveTaskToStage(task.id, 'delivered');
                        setSelectedTaskId(null);
                      }}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Сдать (перенести в колонку «Сдан»)</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STAGE 5: СДАН (CURRENT STAGE === 'delivered') */}
          {/* ========================================================================= */}
          {currentStage === 'delivered' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Проверка рендера экспертом */}
              <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Проверка экспертом (@{task.expertName}):</span>
                  </div>
                  {task.renderApprovedByExpert ? (
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full">
                      Одобрено экспертом
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full">
                      Ожидает согласования
                    </span>
                  )}
                </div>

                {task.renderUrl && (
                  <div className="text-[11px] text-slate-700 bg-white p-2 rounded-lg border border-slate-200 flex items-center justify-between">
                    <span className="truncate mr-2">Рендер: <strong>{task.renderUrl}</strong></span>
                    <a
                      href={task.renderUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-indigo-600 font-semibold text-xs flex items-center gap-1 shrink-0"
                    >
                      <ExternalLink className="w-3 h-3" /> Смотреть
                    </a>
                  </div>
                )}

                {task.coverUrl && (
                  <div className="text-[11px] text-slate-700 bg-white p-2 rounded-lg border border-slate-200 flex items-center justify-between">
                    <span className="truncate mr-2">Обложка: <strong>{task.coverUrl}</strong></span>
                    <a
                      href={task.coverUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-indigo-600 font-semibold text-xs flex items-center gap-1 shrink-0"
                    >
                      <ExternalLink className="w-3 h-3" /> Посмотреть
                    </a>
                  </div>
                )}

                {!task.renderApprovedByExpert && (activeRole === 'expert' || activeRole === 'super_admin') && (
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => reviewRender(task.id, true)}
                      className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors shadow-2xs cursor-pointer"
                    >
                      Одобрить работу
                    </button>
                    <button
                      onClick={() => reviewRender(task.id, false, 'Укоротить хук на 1 секунду')}
                      className="flex-1 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                    >
                      Нужны правки
                    </button>
                  </div>
                )}
              </div>

              {/* 48-Hour Trial Timer & Placement routing (content tasks only) */}
              {task.kind !== 'non_content' && task.placement === 'trial' && (
                <div className="bg-cyan-50/70 border border-cyan-200 rounded-xl p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-cyan-900">
                      <Clock className="w-4 h-4 text-cyan-600 animate-spin" />
                      <span>Статус: Ролик в стадии 48-часового теста</span>
                    </div>
                    <span className="text-[11px] font-mono font-bold text-cyan-800 bg-white px-2 py-0.5 rounded border border-cyan-300">
                      Осталось ~2 часа теста
                    </span>
                  </div>
                  <p className="text-xs text-cyan-800">
                    После 48 часов бот присылает уведомление: перенести ролик в профиль или отправить в архив.
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => promoteTrialToMain(task.id)}
                      className="flex-1 py-1.5 px-3 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold shadow-2xs transition-colors text-center cursor-pointer"
                    >
                      Перенести в основную ленту
                    </button>
                    <button
                      onClick={() => archiveTask(task.id)}
                      className="py-1.5 px-3 rounded-lg bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200 transition-colors cursor-pointer"
                    >
                      В архив
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* MANUAL EDIT MODE (WHEN EDIT IS ACTIVATED BY PRODUCER) */}
          {/* ========================================================================= */}
          {isEditMode && canEdit && (
            <div className="p-4 bg-slate-100/80 rounded-xl border border-slate-300 space-y-3 animate-in fade-in mt-4">
              <div className="text-xs font-bold text-slate-800 flex items-center justify-between">
                <span>Параметры карточки (Режим редактирования)</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1 flex items-center justify-between">
                    <span>Дата съемки (ГГГГ-ММ-ДД ЧЧ:мм)</span>
                    {!isScriptWritten && (
                      <span className="text-[10px] text-amber-700 font-semibold flex items-center gap-1">
                        <Lock className="w-2.5 h-2.5" /> Только после сценария
                      </span>
                    )}
                  </label>
                  <input
                    type="text"
                    value={task.shootingDate || ''}
                    disabled={!isScriptWritten}
                    placeholder={isScriptWritten ? "2026-09-23 15:00" : "Сначала напишите сценарий"}
                    onChange={(e) => updateTaskDetails(task.id, { shootingDate: e.target.value })}
                    className={`w-full px-2.5 py-1.5 text-xs rounded-md border ${
                      !isScriptWritten ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed' : 'bg-white border-slate-200'
                    }`}
                  />
                </div>

                {task.kind !== 'non_content' && (
                  <>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Плановая дата публикации
                      </label>
                      <input
                        type="date"
                        value={task.targetPublishDate || ''}
                        onChange={(e) => updateTaskDetails(task.id, { targetPublishDate: e.target.value })}
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-md"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Плейсмент контента
                      </label>
                      <select
                        value={task.placement}
                        onChange={(e) => setPlacement(task.id, e.target.value as PlacementType)}
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-md"
                      >
                        <option value="unassigned">Не назначен</option>
                        <option value="trial">В пробные (тест 48ч)</option>
                        <option value="main_feed">В основную ленту</option>
                        <option value="archived">В архив</option>
                      </select>
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Назначенный монтажер
                  </label>
                  <input
                    type="text"
                    value={task.assignedEditor || ''}
                    placeholder="Арсений"
                    onChange={(e) => updateTaskDetails(task.id, { assignedEditor: e.target.value })}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-md"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                <button
                  onClick={() => {
                    archiveTask(task.id);
                    setSelectedTaskId(null);
                  }}
                  className="text-xs text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Удалить / В архив
                </button>

                <button
                  onClick={() => setIsEditMode(false)}
                  className="px-3 py-1 bg-indigo-600 text-white text-xs font-semibold rounded-md cursor-pointer"
                >
                  Завершить редактирование
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-400 font-mono">
            Создано {new Date(task.createdAt).toLocaleDateString('ru-RU')}
          </span>
          <button
            onClick={() => setSelectedTaskId(null)}
            className="px-4 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            Закрыть
          </button>
        </div>
      </div>

      {/* Script Reader Modal */}
      {isScriptReaderOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 font-mono">
                  #{task.id} Сценарий для чтения
                </span>
                <h4 className="text-sm font-bold text-slate-900 truncate">
                  {task.title}
                </h4>
              </div>
              <button
                onClick={() => setIsScriptReaderOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div 
              style={{ direction: 'ltr', unicodeBidi: 'isolate' }}
              className="p-5 max-h-[70vh] overflow-y-auto font-normal text-sm leading-relaxed text-slate-800 whitespace-pre-wrap selection:bg-indigo-100"
            >
              {task.scriptText}
            </div>

            <div className="p-3 border-t border-slate-100 bg-slate-50 flex justify-end gap-2">
              <button
                onClick={() => {
                  setIsScriptReaderOpen(false);
                  setSelectedTaskId(null);
                  setEditingScriptTaskId(task.id);
                }}
                className="px-3.5 py-1.5 text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg transition-colors cursor-pointer"
              >
                Редактировать текст
              </button>
              <button
                onClick={() => setIsScriptReaderOpen(false)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Simulate File Drop / Pool Modal */}
      {isSimulatePoolOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-4 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-2">
              <h4 className="text-sm font-bold text-slate-900">
                Загрузка материалов (Пул {task.pools.length + 1})
              </h4>
              <button onClick={() => setIsSimulatePoolOpen(false)} className="text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSimulateFootagePool} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Количество передаваемых файлов
                </label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={simulateFilesCount}
                  onChange={(e) => setSimulateFilesCount(Number(e.target.value))}
                  className="w-full px-3 py-1.5 text-xs border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Примечание к пулу (например: доп. дубли хука, b-roll)
                </label>
                <input
                  type="text"
                  placeholder="Дополнительные дубли с петличкой"
                  value={simulatePoolNote}
                  onChange={(e) => setSimulatePoolNote(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border rounded-lg"
                />
              </div>
              <div className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border">
                При повторной отправке файлов к одному сценарию бот формирует раздельный <b>Пул 2</b>, суммируя общее число файлов и переводя карточку в статус «Монтаж».
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSimulatePoolOpen(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 text-xs font-semibold bg-indigo-600 text-white rounded-lg cursor-pointer"
                >
                  Принять материалы
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Дополнить идею (войс, видео, референс) */}
      {isAddSupplementOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-4 space-y-3.5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-2.5">
              <div className="flex items-center gap-2">
                <Paperclip className="w-4 h-4 text-amber-600" />
                <h4 className="text-sm font-bold text-slate-900">
                  Дополнить идею #{task.id}
                </h4>
              </div>
              <button onClick={() => setIsAddSupplementOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!supplementNote.trim()) return;
                appendIdeaSupplement(task.id, {
                  type: supplementType,
                  note: supplementNote.trim()
                });
                setIsAddSupplementOpen(false);
                setSupplementNote('');
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  Формат вложения:
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
                  Транскрибация / ссылка / суть дополнения:
                </label>
                <textarea
                  value={supplementNote}
                  onChange={(e) => setSupplementNote(e.target.value)}
                  placeholder="Заметка или голосовое пояснение к идее..."
                  rows={3}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddSupplementOpen(false)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Дослать в чат</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Прикрепить рендер (Команда /render) */}
      {isAttachRenderOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-4 space-y-3.5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-2.5">
              <div className="flex items-center gap-2">
                <Video className="w-5 h-5 text-purple-600" />
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Прикрепить рендер #{task.id}
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Запуск команды <code className="text-purple-600 font-mono">/render</code> в чате
                  </p>
                </div>
              </div>
              <button onClick={() => setIsAttachRenderOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                attachRenderFromChat(
                  task.id,
                  renderUrlInput || 'https://assets.mixkit.co/videos/preview/mixkit-girl-talking-to-camera-in-a-studio-setting-42289-large.mp4',
                  undefined,
                  renderNoteInput
                );
                setIsAttachRenderOpen(false);
                setRenderUrlInput('');
              }}
              className="space-y-3 text-xs"
            >
              <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 text-purple-900 text-xs">
                <strong>Команда в чате:</strong> Бот примет файл рендера, обновит статус задачи на «Сдан/Проверка» и отправит эксперту пост с кнопками <strong>[Одобрено]</strong> и <strong>[Нужны правки]</strong>.
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Ссылка на файл рендера (MP4 / облако):
                </label>
                <input
                  type="text"
                  value={renderUrlInput}
                  onChange={(e) => setRenderUrlInput(e.target.value)}
                  placeholder="https://t.me/c/2145893201/render_v1.mp4"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Примечание монтажера:
                </label>
                <input
                  type="text"
                  value={renderNoteInput}
                  onChange={(e) => setRenderNoteInput(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAttachRenderOpen(false)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Запустить /render</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Добавить обложку отдельной командой (/cover) */}
      {isAttachCoverOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-4 space-y-3.5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-2.5">
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-indigo-600" />
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Добавить обложку #{task.id}
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Запуск команды <code className="text-indigo-600 font-mono">/cover</code> в чате
                  </p>
                </div>
              </div>
              <button onClick={() => setIsAttachCoverOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                attachCover(
                  task.id,
                  coverUrlInput || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80'
                );
                setIsAttachCoverOpen(false);
                setCoverUrlInput('');
              }}
              className="space-y-3 text-xs"
            >
              <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-200 text-indigo-900 text-xs">
                <strong>Обложка ролика:</strong> Загрузите превью / обложку для Reels или поста отдельной командой без необходимости перезаливать весь рендер.
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Ссылка на изображение обложки (JPG / PNG):
                </label>
                <input
                  type="text"
                  value={coverUrlInput}
                  onChange={(e) => setCoverUrlInput(e.target.value)}
                  placeholder="https://t.me/c/2145893201/cover_preview.jpg"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAttachCoverOpen(false)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Запустить /cover</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>,
    document.body
  );
};

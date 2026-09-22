import React, { useState } from 'react';
import { useProduction } from '../context/ProductionContext';
import { ContentType, TaskKind } from '../types';
import { 
  X, 
  Film, 
  Layers, 
  Circle, 
  Briefcase, 
  Calendar, 
  User, 
  Tag, 
  AlignLeft, 
  Sparkles,
  Mic,
  Image as ImageIcon
} from 'lucide-react';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultDate?: string;
  defaultKind?: TaskKind;
}

const COMMON_NON_CONTENT_CATEGORIES = [
  'Сайт',
  'Кастдевы',
  'Опросы',
  'Аналитика',
  'Маркетинг',
  'Презентация',
  'Организация',
  'Другое',
];

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  isOpen,
  onClose,
  defaultDate,
  defaultKind = 'content',
}) => {
  const { createTask, currentExpertId, experts, chatUsers } = useProduction();

  const [taskKind, setTaskKind] = useState<TaskKind>(defaultKind);

  // Content task state
  const [contentType, setContentType] = useState<ContentType>('reels');
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState(defaultDate || '');
  const [description, setDescription] = useState('');
  const [hasVoiceNotes, setHasVoiceNotes] = useState(false);
  const [hasMediaReferences, setHasMediaReferences] = useState(false);

  // Non-content task state
  const [nonContentCategory, setNonContentCategory] = useState('Сайт');
  const [assignedPerson, setAssignedPerson] = useState('Кирилл (Продюсер)');
  const [nonContentStatus, setNonContentStatus] = useState<'todo' | 'in_progress' | 'done'>('todo');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    createTask({
      title: title.trim(),
      kind: taskKind,
      type: contentType,
      nonContentCategory: taskKind === 'non_content' ? nonContentCategory : undefined,
      assignedTo: taskKind === 'non_content' ? assignedPerson : undefined,
      nonContentStatus: taskKind === 'non_content' ? nonContentStatus : undefined,
      hasVoiceNotes: taskKind === 'content' ? hasVoiceNotes : false,
      hasMediaReferences: taskKind === 'content' ? hasMediaReferences : false,
      note: description.trim(),
      targetDueDate: dueDate || undefined,
    });

    // Reset and close
    setTitle('');
    setDescription('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div 
        className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span>Добавить задачу</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Выберите тип задачи: контент или операционная деятельность
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Kind Toggle (Контент vs Не контент) */}
        <div className="p-4 pb-0">
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100/80 rounded-xl border border-slate-200/80">
            <button
              type="button"
              onClick={() => setTaskKind('content')}
              className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                taskKind === 'content'
                  ? 'bg-white text-indigo-700 shadow-xs border border-indigo-100'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Film className="w-3.5 h-3.5" />
              <span>Контент</span>
            </button>
            <button
              type="button"
              onClick={() => setTaskKind('non_content')}
              className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                taskKind === 'non_content'
                  ? 'bg-white text-indigo-700 shadow-xs border border-indigo-100'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>Задачи</span>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Format / Category Selector */}
          {taskKind === 'content' ? (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Формат контента:
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setContentType('reels')}
                  className={`py-2 px-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    contentType === 'reels'
                      ? 'border-purple-500 bg-purple-50 text-purple-800 ring-2 ring-purple-100'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <Film className="w-3.5 h-3.5 text-purple-600" />
                  <span>Рилс</span>
                </button>
                <button
                  type="button"
                  onClick={() => setContentType('carousel')}
                  className={`py-2 px-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    contentType === 'carousel'
                      ? 'border-blue-500 bg-blue-50 text-blue-800 ring-2 ring-blue-100'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5 text-blue-600" />
                  <span>Карусель</span>
                </button>
                <button
                  type="button"
                  onClick={() => setContentType('stories')}
                  className={`py-2 px-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    contentType === 'stories'
                      ? 'border-amber-500 bg-amber-50 text-amber-800 ring-2 ring-amber-100'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <Circle className="w-3.5 h-3.5 text-amber-500 fill-amber-500/20" />
                  <span>Сторис</span>
                </button>
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                <span>Категория задачи:</span>
              </label>

              {/* Category preset chips */}
              <div className="flex flex-wrap gap-1.5 mb-2">
                {COMMON_NON_CONTENT_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setNonContentCategory(cat)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                      nonContentCategory === cat
                        ? 'bg-indigo-50 border-indigo-300 text-indigo-800 font-bold'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <input
                type="text"
                value={nonContentCategory}
                onChange={(e) => setNonContentCategory(e.target.value)}
                placeholder="Или введите свою категорию..."
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          )}

          {/* Title input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Название задачи: *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={
                taskKind === 'content'
                  ? 'Например: 5 ошибок новичков в инвестициях'
                  : 'Например: Собрать лендинг для вебинара или провести 5 кастдевов'
              }
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
            />
          </div>

          {/* Due date and Assignment */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Срок сдачи (дедлайн):</span>
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {taskKind === 'non_content' ? (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>Ответственный:</span>
                </label>
                <select
                  value={assignedPerson}
                  onChange={(e) => setAssignedPerson(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Кирилл (Продюсер)">Кирилл (Продюсер)</option>
                  <option value="Вера (Эксперт)">Вера (Эксперт)</option>
                  <option value="Арсений (Монтажер)">Арсений (Монтажер)</option>
                  <option value="Марина (Дизайнер)">Марина (Дизайнер)</option>
                  <option value="Вся команда">Вся команда</option>
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>Эксперт проекта:</span>
                </label>
                <div className="px-3 py-2 text-xs bg-slate-100/70 border border-slate-200 rounded-lg text-slate-700 font-medium">
                  {experts.find(e => e.id === currentExpertId)?.name || 'Вера'}
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <AlignLeft className="w-3.5 h-3.5 text-slate-400" />
              <span>Описание, тезисы или чек-лист:</span>
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={
                taskKind === 'content'
                  ? 'Основные мысли сценария, крючок в начале, референсы...'
                  : 'Что конкретно нужно сделать, ссылки на документы, критерии готовности...'
              }
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          {/* Additional toggles for content */}
          {taskKind === 'content' && (
            <div className="pt-1 flex flex-wrap gap-4 text-xs">
              <label className="flex items-center gap-2 cursor-pointer text-slate-700 select-none">
                <input
                  type="checkbox"
                  checked={hasVoiceNotes}
                  onChange={(e) => setHasVoiceNotes(e.target.checked)}
                  className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                />
                <span className="flex items-center gap-1">
                  <Mic className="w-3 h-3 text-slate-400" />
                  Есть голосовые заметки
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-slate-700 select-none">
                <input
                  type="checkbox"
                  checked={hasMediaReferences}
                  onChange={(e) => setHasMediaReferences(e.target.checked)}
                  className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                />
                <span className="flex items-center gap-1">
                  <ImageIcon className="w-3 h-3 text-slate-400" />
                  Есть медиа-референсы
                </span>
              </label>
            </div>
          )}

          {/* Non-content initial status */}
          {taskKind === 'non_content' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Статус выполнения:
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setNonContentStatus('todo')}
                  className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                    nonContentStatus === 'todo'
                      ? 'bg-slate-100 border-slate-400 text-slate-900 font-bold'
                      : 'bg-white border-slate-200 text-slate-600'
                  }`}
                >
                  К выполнению
                </button>
                <button
                  type="button"
                  onClick={() => setNonContentStatus('in_progress')}
                  className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                    nonContentStatus === 'in_progress'
                      ? 'bg-amber-50 border-amber-400 text-amber-900 font-bold'
                      : 'bg-white border-slate-200 text-slate-600'
                  }`}
                >
                  В работе
                </button>
                <button
                  type="button"
                  onClick={() => setNonContentStatus('done')}
                  className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                    nonContentStatus === 'done'
                      ? 'bg-emerald-50 border-emerald-400 text-emerald-900 font-bold'
                      : 'bg-white border-slate-200 text-slate-600'
                  }`}
                >
                  Готово
                </button>
              </div>
            </div>
          )}

          {/* Modal Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Отмена
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Создать задачу</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

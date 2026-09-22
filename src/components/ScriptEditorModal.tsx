import React, { useState, useRef, useEffect } from 'react';
import { useProduction } from '../context/ProductionContext';
import { 
  X, 
  Save, 
  CheckCircle2, 
  Heading1, 
  Heading2, 
  Bold, 
  Italic, 
  List, 
  ListOrdered, 
  Quote, 
  Sparkles,
  Calendar,
  AlertCircle
} from 'lucide-react';

export const ScriptEditorModal: React.FC = () => {
  const { 
    tasks, 
    editingScriptTaskId, 
    setEditingScriptTaskId, 
    saveScriptDraft, 
    approveScript,
    scheduleShooting,
    setSelectedTaskId
  } = useProduction();

  const task = tasks.find(t => t.id === editingScriptTaskId);
  
  // Script text in uncontrolled or stabilized ref to avoid text reverse bug
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [characterCount, setCharacterCount] = useState(0);
  const [wordCount, setWordCount] = useState(0);
  const [estimatedSeconds, setEstimatedSeconds] = useState(0);

  // Dialog for shooting date if Reels approved
  const [showShootPrompt, setShowShootPrompt] = useState(false);
  const [shootingDateInput, setShootingDateInput] = useState('2026-09-23 15:00');

  useEffect(() => {
    if (task && textareaRef.current) {
      const initial = task.scriptText || '';
      textareaRef.current.value = initial;
      updateMetrics(initial);
    }
  }, [task]);

  if (!task) return null;

  const updateMetrics = (text: string) => {
    const chars = text.length;
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    // Average speaking speed in Russian reels ~ 2.2 words per second
    const estSec = Math.round(words / 2.2);
    setCharacterCount(chars);
    setWordCount(words);
    setEstimatedSeconds(estSec);
  };

  const handleTextChange = () => {
    if (textareaRef.current) {
      updateMetrics(textareaRef.current.value);
    }
  };

  // Basic formatting helpers (insert markdown tags at selection without breaking LTR flow)
  const applyFormat = (prefix: string, suffix = '') => {
    const el = textareaRef.current;
    if (!el) return;

    const start = el.selectionStart;
    const end = el.selectionEnd;
    const currentVal = el.value;
    const selected = currentVal.substring(start, end);

    const replacement = `${prefix}${selected || 'текст'}${suffix}`;
    el.value = currentVal.substring(0, start) + replacement + currentVal.substring(end);
    
    // reset selection
    const newPos = start + prefix.length + (selected ? selected.length : 5);
    el.focus();
    el.setSelectionRange(newPos, newPos);
    updateMetrics(el.value);
  };

  const handleSaveDraft = () => {
    if (textareaRef.current) {
      const text = textareaRef.current.value;
      saveScriptDraft(task.id, text);
      setEditingScriptTaskId(null);
      setSelectedTaskId(task.id);
    }
  };

  const handleApproveClick = () => {
    if (textareaRef.current) {
      const text = textareaRef.current.value;
      if (task.type === 'reels') {
        setShowShootPrompt(true);
      } else {
        approveScript(task.id, text);
        setEditingScriptTaskId(null);
        setSelectedTaskId(task.id);
      }
    }
  };

  const handleConfirmShootAndApprove = (e: React.FormEvent) => {
    e.preventDefault();
    if (textareaRef.current) {
      const text = textareaRef.current.value;
      approveScript(task.id, text);
      if (shootingDateInput.trim()) {
        scheduleShooting(task.id, shootingDateInput.trim());
      }
      setShowShootPrompt(false);
      setEditingScriptTaskId(null);
      setSelectedTaskId(task.id);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-2 sm:p-4">
      <div className="bg-white rounded-2xl w-full max-w-3xl h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
        
        {/* Editor Top Bar */}
        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-mono text-xs font-bold bg-slate-200 text-slate-800 px-2 py-0.5 rounded shrink-0">
              #{task.id}
            </span>
            <div className="truncate">
              <h3 className="text-sm font-bold text-slate-900 truncate">
                {task.title}
              </h3>
              <span className="text-[11px] text-slate-500">
                Редактор сценария · {task.type === 'reels' ? 'Reels' : task.type === 'carousel' ? 'Карусель' : 'Stories'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setEditingScriptTaskId(null)}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Formatting Toolbar (Спецификация 4.4: Базовое форматирование) */}
        <div className="px-4 py-2 border-b border-slate-200 bg-white flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => applyFormat('# ', '')}
              className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded text-xs font-bold"
              title="Заголовок H1"
            >
              <Heading1 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => applyFormat('## ', '')}
              className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded text-xs font-bold"
              title="Заголовок H2"
            >
              <Heading2 className="w-4 h-4" />
            </button>
            <div className="w-px h-4 bg-slate-200 mx-1" />
            <button
              type="button"
              onClick={() => applyFormat('**', '**')}
              className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded text-xs font-bold"
              title="Жирный"
            >
              <Bold className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => applyFormat('*', '*')}
              className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded text-xs"
              title="Курсив"
            >
              <Italic className="w-4 h-4" />
            </button>
            <div className="w-px h-4 bg-slate-200 mx-1" />
            <button
              type="button"
              onClick={() => applyFormat('1. ', '')}
              className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded text-xs"
              title="Нумерованный список"
            >
              <ListOrdered className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => applyFormat('- ', '')}
              className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded text-xs"
              title="Маркированный список"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => applyFormat('> **Хук:** ', '')}
              className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded text-xs"
              title="Хук / Цитата"
            >
              <Quote className="w-4 h-4" />
            </button>
          </div>

          {/* Words and Estimated Timing */}
          <div className="text-[11px] text-slate-500 font-mono flex items-center gap-3">
            <span>{wordCount} слов</span>
            <span>~{estimatedSeconds} сек. хронометража</span>
          </div>
        </div>

        {/* Text Area (Спецификация 4.4: Полноценное поле ввода со стилем direction: ltr; и неконтролируемым вводом для устранения бага реверса текста) */}
        <div className="flex-1 p-4 bg-slate-50/40 relative">
          <textarea
            ref={textareaRef}
            onChange={handleTextChange}
            dir="ltr"
            style={{ direction: 'ltr', unicodeBidi: 'isolate' }}
            placeholder="Напишите хук, тезисы и призыв к действию (CTA)..."
            className="w-full h-full p-4 text-sm sm:text-base font-normal leading-relaxed text-slate-800 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none font-sans"
            spellCheck={true}
          />
        </div>

        {/* Editor Bottom Bar: [Сохранить] и [Утвердить] */}
        <div className="p-3 bg-white border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500 hidden sm:block">
            {task.scriptStatus === 'yellow' ? 'Сохранен как черновик' : task.scriptStatus === 'green' ? 'Сценарий утвержден' : 'Без сценария'}
          </div>

          <div className="flex items-center gap-2">
            {/* [Сохранить] -> желтый статус (черновик) */}
            <button
              id="btn-save-draft"
              onClick={handleSaveDraft}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <Save className="w-4 h-4 text-amber-600" />
              <span>Сохранить черновик</span>
            </button>

            {/* [Утвердить] -> зеленый статус (утвержден) */}
            <button
              id="btn-approve-script"
              onClick={handleApproveClick}
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-xs"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Утвердить сценарий</span>
            </button>
          </div>
        </div>
      </div>

      {/* Prompt for Shooting date when Reels script is approved (Раздел 5.2 ТЗ) */}
      {showShootPrompt && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-5 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center gap-2.5 text-emerald-700">
              <CheckCircle2 className="w-6 h-6" />
              <h4 className="text-base font-bold text-slate-900">
                Сценарий #{task.id} утвержден!
              </h4>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Бот отправляет эксперту <b>@{task.expertName}</b> в чат:
              <br />
              <i className="text-indigo-900 bg-indigo-50 p-1 rounded mt-1 block">
                «@Вера, когда планируем съемку? Напиши дату и время».
              </i>
            </p>

            <form onSubmit={handleConfirmShootAndApprove} className="space-y-3 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Дата и время съемки
                </label>
                <input
                  type="text"
                  required
                  value={shootingDateInput}
                  onChange={(e) => setShootingDateInput(e.target.value)}
                  placeholder="Среда 15:00 или 2026-09-23 15:00"
                  className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded-lg">
                Событие с меткой <b>«Съемка»</b> добавится в календарь, а этап «Съемка» перейдет в статус ожидания.
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowShootPrompt(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-xs"
                >
                  Зафиксировать съемку
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

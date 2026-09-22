import React, { useState } from 'react';
import { useProduction } from '../context/ProductionContext';
import { 
  X, 
  Radio, 
  Send, 
  Lightbulb, 
  Video, 
  FolderPlus, 
  CheckCircle2, 
  Clock, 
  Sparkles,
  Bot,
  Trash2,
  ExternalLink,
  RotateCcw,
  Check,
  ChevronRight
} from 'lucide-react';

interface BotCoordinatorDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BotCoordinatorDrawer: React.FC<BotCoordinatorDrawerProps> = ({ isOpen, onClose }) => {
  const { 
    botLogs, 
    addBotLog, 
    tasks, 
    createIdea, 
    addFootagePool, 
    submitRender, 
    reviewRender, 
    markTrialPublished, 
    currentExpertId 
  } = useProduction();

  // FSM simulation for Topic 1: Idea recording
  const [fsmTopic1State, setFsmTopic1State] = useState<'idle' | 'recording' | 'awaiting_title'>('idle');
  const [fsmContentType, setFsmContentType] = useState<'reels' | 'carousel' | 'stories'>('reels');
  const [fsmIdeaTitle, setFsmIdeaTitle] = useState('');
  const [fsmRecordedCount, setFsmRecordedCount] = useState(2);

  // Quick action states
  const [selectedTaskForPool, setSelectedTaskForPool] = useState<string>('');
  const [selectedTaskForRender, setSelectedTaskForRender] = useState<string>('');

  if (!isOpen) return null;

  // Topic 1: Start recording idea
  const handleStartIdeaSession = (type: 'reels' | 'carousel' | 'stories') => {
    setFsmContentType(type);
    setFsmTopic1State('recording');
    addBotLog(
      'Идеи',
      `Бот: Запись идеи началась. Присылай текст, ссылки, войсы или видео. Нажми «Завершить запись».`,
      'fsm_start'
    );
  };

  // Topic 1: Finish recording, ask for title
  const handleFinishRecording = () => {
    setFsmTopic1State('awaiting_title');
    addBotLog(
      'Идеи',
      `Бот: «Как назовем идею? Напиши тему одним сообщением.»`,
      'fsm_ask_title'
    );
  };

  // Topic 1: Submit title & trigger auto-clean
  const handleSubmitTitle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fsmIdeaTitle.trim()) return;

    const newTask = createIdea({
      title: fsmIdeaTitle.trim(),
      type: fsmContentType,
      hasVoiceNotes: true,
      hasMediaReferences: true,
    });

    addBotLog(
      'Идеи',
      `Автоочистка служебных сообщений. Опубликован итоговый пост:\nИдея #${newTask.id}: ${newTask.title}\nМатериалы зафиксированы. Создана карточка в TMA.`,
      'idea_created'
    );

    setFsmIdeaTitle('');
    setFsmTopic1State('idle');
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs">
      <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
        
        {/* Drawer Header */}
        <div className="p-4 border-b border-slate-200 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm tracking-tight flex items-center gap-1.5">
                Координатор топиков Telegram
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </h3>
              <p className="text-[11px] text-slate-300">
                Маршрутизатор супергруппы (Раздел 5 ТЗ)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5 text-slate-800">
          
          {/* TOPIC 1: «ИДЕИ» (Сессионная фиксация) */}
          <section className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Lightbulb className="w-4 h-4 text-amber-500" />
                Топик «Идеи»: Сессионная фиксация
              </span>
              <span className="text-[10px] font-mono font-semibold bg-white px-1.5 py-0.5 rounded border text-slate-500">
                FSM State
              </span>
            </div>

            {fsmTopic1State === 'idle' && (
              <div className="space-y-2">
                <div className="text-[11px] text-slate-500">
                  В закрепе топика кнопка <b>[Зафиксировать идею]</b>:
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    onClick={() => handleStartIdeaSession('reels')}
                    className="py-1.5 px-2 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 rounded-lg text-xs font-bold transition-colors"
                  >
                    Reels
                  </button>
                  <button
                    onClick={() => handleStartIdeaSession('carousel')}
                    className="py-1.5 px-2 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-lg text-xs font-bold transition-colors"
                  >
                    Карусель
                  </button>
                  <button
                    onClick={() => handleStartIdeaSession('stories')}
                    className="py-1.5 px-2 bg-orange-50 hover:bg-orange-100 text-orange-800 border border-orange-200 rounded-lg text-xs font-bold transition-colors"
                  >
                    Stories
                  </button>
                </div>
              </div>
            )}

            {fsmTopic1State === 'recording' && (
              <div className="bg-indigo-50/70 p-3 rounded-lg border border-indigo-200 space-y-2">
                <div className="text-xs text-indigo-900 font-medium">
                  <i>«Запись идеи начата. Эксперт присылает войсы, ссылки и текст...»</i>
                </div>
                <button
                  onClick={handleFinishRecording}
                  className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-md shadow-2xs transition-colors"
                >
                  Завершить запись
                </button>
              </div>
            )}

            {fsmTopic1State === 'awaiting_title' && (
              <form onSubmit={handleSubmitTitle} className="space-y-2">
                <div className="text-[11px] text-slate-600">
                  <i>«Как назовем идею? Напиши тему одним сообщением.»</i>
                </div>
                <input
                  type="text"
                  required
                  placeholder="Тема идеи..."
                  value={fsmIdeaTitle}
                  onChange={(e) => setFsmIdeaTitle(e.target.value)}
                  className="w-full p-2 text-xs bg-white border border-slate-300 rounded-lg"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-2xs"
                  >
                    Отправить тему и создать карточку
                  </button>
                </div>
              </form>
            )}
          </section>

          {/* TOPIC 2: «СЪЕМКА/МАТЕРИАЛЫ» (Прием исходников и досылов) */}
          <section className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 space-y-2.5">
            <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <FolderPlus className="w-4 h-4 text-indigo-600" />
              Топик «Съемка/Материалы»: Формирование пулов
            </span>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Первая загрузка фиксируется как <b>Пул 1</b>. При повторной отправке создается <b>Пул 2</b>, а карточка переводится в статус <b>«Монтаж»</b> с тегом монтажера.
            </p>

            <div className="space-y-2">
              <select
                value={selectedTaskForPool}
                onChange={(e) => setSelectedTaskForPool(e.target.value)}
                className="w-full p-2 text-xs bg-white border rounded-lg"
              >
                <option value="">Выберите сценарий для заливки исходников...</option>
                {tasks.filter(t => t.expertId === currentExpertId && !t.isArchived).map(t => (
                  <option key={t.id} value={t.id}>
                    #{t.id} {t.title.slice(0, 32)}... (Пулов: {t.pools.length})
                  </option>
                ))}
              </select>

              {selectedTaskForPool && (
                <button
                  onClick={() => {
                    addFootagePool(selectedTaskForPool, 4, 'Досыл дублей через бота');
                    setSelectedTaskForPool('');
                  }}
                  className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-2xs transition-colors"
                >
                  Имитировать отправку пачки файлов (Пул +1)
                </button>
              )}
            </div>
          </section>

          {/* TOPIC 3: «МОНТАЖ/РИЛСЫ» (Сдача и согласование) */}
          <section className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 space-y-2.5">
            <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <Video className="w-4 h-4 text-indigo-600" />
              Топик «Монтаж/Рилсы»: Сдача ролика монтажером
            </span>
            <p className="text-[11px] text-slate-500">
              Монтажер жмет <b>[Сдать готовый ролик]</b> → бот тегает эксперта: <b>[Одобрено] [Нужны правки]</b>
            </p>

            <div className="space-y-2">
              <select
                value={selectedTaskForRender}
                onChange={(e) => setSelectedTaskForRender(e.target.value)}
                className="w-full p-2 text-xs bg-white border rounded-lg"
              >
                <option value="">Выберите ролик в монтаже...</option>
                {tasks.filter(t => t.type === 'reels' && t.expertId === currentExpertId && !t.isArchived).map(t => (
                  <option key={t.id} value={t.id}>
                    #{t.id} {t.title.slice(0, 32)}...
                  </option>
                ))}
              </select>

              {selectedTaskForRender && (
                <button
                  onClick={() => {
                    submitRender(selectedTaskForRender, 'https://assets.mixkit.co/videos/preview/mixkit-girl-talking-to-camera-in-a-studio-setting-42289-large.mp4');
                    setSelectedTaskForRender('');
                  }}
                  className="w-full py-1.5 bg-slate-800 hover:bg-black text-white text-xs font-bold rounded-lg shadow-2xs transition-colors"
                >
                  Сдать готовый ролик и тегнуть эксперта
                </button>
              )}
            </div>
          </section>

          {/* LIVE TOPIC LOGS FEED */}
          <div className="space-y-2 pt-2 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Логи активности топиков
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Realtime</span>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto text-xs">
              {botLogs.map(log => (
                <div key={log.id} className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/80 space-y-1">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">
                      Топик: {log.topic}
                    </span>
                    <span className="text-slate-400 font-mono">{log.time}</span>
                  </div>
                  <div className="text-slate-800 whitespace-pre-wrap font-sans text-[11px] leading-relaxed">
                    {log.text}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Drawer Footer */}
        <div className="p-3 border-t border-slate-200 bg-slate-50 flex justify-between items-center shrink-0">
          <span className="text-[11px] text-slate-400">
            Все события зеркалируются в TMA
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-semibold"
          >
            Закрыть
          </button>
        </div>

      </div>
    </div>
  );
};

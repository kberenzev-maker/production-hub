import React, { useState, useMemo } from 'react';
import { useProduction } from '../context/ProductionContext';
import { TaskCard } from '../types';
import { 
  Download, 
  Copy, 
  Check, 
  Edit2, 
  Video, 
  Image as ImageIcon,
  CheckCircle2,
  Clock
} from 'lucide-react';

export const PublisherView: React.FC = () => {
  const { 
    tasks, 
    currentExpertId, 
    updateTaskDetails, 
    markTrialPublished, 
    promoteTrialToMain,
    activeRole
  } = useProduction();

  const [activeTab, setActiveTab] = useState<'queue' | 'active_trials' | 'published'>('queue');
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [captionInput, setCaptionInput] = useState('');
  const [hashtagsInput, setHashtagsInput] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const isSuperAdmin = activeRole === 'super_admin';
  const isPublisher = activeRole === 'publisher' || isSuperAdmin;

  const expertTasks = useMemo(() => {
    return tasks.filter(t => 
      t.expertId === currentExpertId && 
      !t.isArchived && 
      !t.rejected &&
      t.kind !== 'non_content' &&
      (t.type === 'reels' || t.type === 'carousel' || t.type === 'stories')
    );
  }, [tasks, currentExpertId]);

  const queueTasks = useMemo(() => {
    return expertTasks.filter(t => 
      (t.editingStatus === 'green' && t.placement === 'unassigned') ||
      (t.renderApprovedByExpert && t.placement === 'unassigned')
    );
  }, [expertTasks]);

  const activeTrials = useMemo(() => {
    return expertTasks.filter(t => t.placement === 'trial');
  }, [expertTasks]);

  const publishedTasks = useMemo(() => {
    return expertTasks.filter(t => t.placement === 'main_feed');
  }, [expertTasks]);

  const getSmartSchedule = (task: TaskCard, index: number) => {
    if (task.trialStartDate && task.finalPublishDate) {
      return {
        trialText: task.trialStartDate,
        mainText: task.finalPublishDate
      };
    }

    const weeksOffset = index;
    const baseSunday = new Date(2026, 8, 20 + (weeksOffset * 7), 18, 0);
    const baseTuesday = new Date(2026, 8, 22 + (weeksOffset * 7), 18, 0);

    const formatRuShort = (d: Date) => {
      const day = d.getDate();
      const months = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
      return `${day} ${months[d.getMonth()]}, 18:00`;
    };

    return {
      trialText: `Вс, ${formatRuShort(baseSunday)}`,
      mainText: `Вт, ${formatRuShort(baseTuesday)}`
    };
  };

  const handleStartEdit = (task: TaskCard) => {
    setEditingCardId(task.id);
    setCaptionInput(task.captionText || '');
    setHashtagsInput(task.hashtags || '#эксперт #продюсирование #reels');
  };

  const handleSaveCaption = (taskId: string) => {
    updateTaskDetails(taskId, {
      captionText: captionInput,
      hashtags: hashtagsInput,
    });
    setEditingCardId(null);
  };

  const handleCopyText = (task: TaskCard) => {
    const text = `${task.captionText || task.title}\n\n${task.hashtags || '#эксперт #reels'}`;
    navigator.clipboard.writeText(text);
    setCopiedId(task.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-4">
      {/* iOS Segmented Control */}
      <div className="bg-[#767680]/12 p-0.5 rounded-[9px] flex items-center select-none">
        <button
          type="button"
          onClick={() => setActiveTab('queue')}
          className={`flex-1 py-1.5 text-[13px] font-medium rounded-[7px] text-center transition-all cursor-pointer ${
            activeTab === 'queue'
              ? 'bg-white text-black shadow-xs font-semibold'
              : 'text-[#8E8E93] hover:text-black'
          }`}
        >
          Очередь ({queueTasks.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('active_trials')}
          className={`flex-1 py-1.5 text-[13px] font-medium rounded-[7px] text-center transition-all cursor-pointer ${
            activeTab === 'active_trials'
              ? 'bg-white text-black shadow-xs font-semibold'
              : 'text-[#8E8E93] hover:text-black'
          }`}
        >
          Пробные ({activeTrials.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('published')}
          className={`flex-1 py-1.5 text-[13px] font-medium rounded-[7px] text-center transition-all cursor-pointer ${
            activeTab === 'published'
              ? 'bg-white text-black shadow-xs font-semibold'
              : 'text-[#8E8E93] hover:text-black'
          }`}
        >
          Лента ({publishedTasks.length})
        </button>
      </div>

      {/* 1. QUEUE */}
      {activeTab === 'queue' && (
        <div className="space-y-6">
          {queueTasks.length === 0 ? (
            <div className="bg-white rounded-[16px] p-8 text-center text-[#8E8E93] border border-[#C6C6C8]/30">
              <p className="text-[15px] font-medium text-black">Очередь пуста</p>
            </div>
          ) : (
            queueTasks.map((task, idx) => {
              const schedule = getSmartSchedule(task, idx);
              const isEditing = editingCardId === task.id;

              return (
                <div key={task.id} className="bg-white rounded-[16px] p-4 sm:p-5 border border-[#C6C6C8]/30 space-y-4">
                  {/* Entity Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-[#C6C6C8]/30">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-medium text-[#8E8E93]">#{task.id}</span>
                      <h3 className="text-[16px] font-semibold text-black tracking-tight">{task.title}</h3>
                    </div>
                    <span className="text-[12px] font-medium text-[#34C759]">Готов к релизу</span>
                  </div>

                  {/* Materials Row */}
                  <div className="flex items-center gap-3">
                    <a
                      href={task.renderUrl || `https://t.me/c/2145893021/4/${task.id}99`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 py-2 px-3 rounded-[10px] bg-[#767680]/8 hover:bg-[#767680]/14 flex items-center justify-between transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Video className="w-4 h-4 text-[#007AFF]" />
                        <span className="text-[14px] text-black">Видео (MP4)</span>
                      </div>
                      <Download className="w-3.5 h-3.5 text-[#007AFF]" />
                    </a>

                    <a
                      href={task.coverUrl || `https://t.me/c/2145893021/4/${task.id}98`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 py-2 px-3 rounded-[10px] bg-[#767680]/8 hover:bg-[#767680]/14 flex items-center justify-between transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <ImageIcon className="w-4 h-4 text-[#007AFF]" />
                        <span className="text-[14px] text-black">Обложка (PNG)</span>
                      </div>
                      <Download className="w-3.5 h-3.5 text-[#007AFF]" />
                    </a>
                  </div>

                  {/* Post Text */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-[13px]">
                      <span className="font-medium text-[#8E8E93]">Текст публикации</span>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => handleCopyText(task)}
                          className="text-[#007AFF] font-medium flex items-center gap-1 cursor-pointer"
                        >
                          {copiedId === task.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedId === task.id ? 'Скопировано' : 'Скопировать'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => isEditing ? handleSaveCaption(task.id) : handleStartEdit(task)}
                          className="text-[#007AFF] font-medium cursor-pointer"
                        >
                          {isEditing ? 'Сохранить' : 'Редактировать'}
                        </button>
                      </div>
                    </div>

                    <div className="bg-[#767680]/6 rounded-[10px] p-3">
                      {isEditing ? (
                        <div className="space-y-2">
                          <textarea
                            rows={3}
                            dir="ltr"
                            value={captionInput}
                            onChange={(e) => setCaptionInput(e.target.value)}
                            className="w-full text-[14px] text-black bg-transparent focus:outline-none resize-none leading-relaxed"
                          />
                          <input
                            type="text"
                            dir="ltr"
                            value={hashtagsInput}
                            onChange={(e) => setHashtagsInput(e.target.value)}
                            className="w-full text-[13px] text-[#007AFF] bg-transparent border-t border-[#C6C6C8]/40 pt-2 focus:outline-none"
                          />
                        </div>
                      ) : (
                        <div className="text-[14px] text-black leading-relaxed whitespace-pre-wrap">
                          {task.captionText || task.title}
                          <div className="text-[#007AFF] text-[13px] mt-1.5">
                            {task.hashtags || '#эксперт #продюсирование #reels'}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Schedule Details */}
                  <div className="space-y-1.5 pt-1 text-[14px]">
                    <div className="flex items-center justify-between">
                      <span className="text-[#8E8E93]">Пробный тест:</span>
                      <span className="font-medium text-black">{schedule.trialText}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#8E8E93]">Основная лента:</span>
                      <span className="font-medium text-black">{schedule.mainText}</span>
                    </div>
                  </div>

                  {/* Single Blue Primary CTA */}
                  {isPublisher && (
                    <button
                      type="button"
                      onClick={() => markTrialPublished(task.id)}
                      className="w-full h-11 bg-[#007AFF] hover:bg-[#007AFF]/90 text-white font-semibold text-[15px] rounded-[12px] flex items-center justify-center transition-colors cursor-pointer"
                    >
                      Подтвердить публикацию
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* 2. ACTIVE TRIALS */}
      {activeTab === 'active_trials' && (
        <div className="space-y-6">
          {activeTrials.length === 0 ? (
            <div className="bg-white rounded-[16px] p-8 text-center text-[#8E8E93] border border-[#C6C6C8]/30">
              <p className="text-[15px] font-medium text-black">Нет активных тестов</p>
            </div>
          ) : (
            activeTrials.map(task => (
              <div key={task.id} className="bg-white rounded-[16px] p-4 sm:p-5 border border-[#C6C6C8]/30 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#C6C6C8]/30">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-medium text-[#8E8E93]">#{task.id}</span>
                    <h3 className="text-[16px] font-semibold text-black tracking-tight">{task.title}</h3>
                  </div>
                  <span className="text-[12px] font-medium text-[#FF9500]">Тест (48ч)</span>
                </div>

                <div className="space-y-1.5 text-[14px]">
                  <div className="flex items-center justify-between">
                    <span className="text-[#8E8E93]">Осталось:</span>
                    <span className="font-medium text-[#FF9500]">18 ч 42 мин</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#8E8E93]">Итог:</span>
                    <span className="font-medium text-black">Вторник, 18:00</span>
                  </div>
                </div>

                {isPublisher && (
                  <button
                    type="button"
                    onClick={() => promoteTrialToMain(task.id)}
                    className="w-full h-11 bg-[#007AFF] hover:bg-[#007AFF]/90 text-white font-semibold text-[15px] rounded-[12px] flex items-center justify-center transition-colors cursor-pointer"
                  >
                    Опубликовать в ленте
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* 3. PUBLISHED ARCHIVE */}
      {activeTab === 'published' && (
        <div className="space-y-6">
          {publishedTasks.length === 0 ? (
            <div className="bg-white rounded-[16px] p-8 text-center text-[#8E8E93] border border-[#C6C6C8]/30">
              <p className="text-[15px] font-medium text-black">Нет опубликованных материалов</p>
            </div>
          ) : (
            <div className="bg-white rounded-[16px] divide-y divide-[#C6C6C8]/40 border border-[#C6C6C8]/30 overflow-hidden">
              {publishedTasks.map(task => (
                <div key={task.id} className="px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <CheckCircle2 className="w-5 h-5 text-[#34C759] shrink-0" />
                    <span className="text-[15px] font-normal text-black truncate">{task.title}</span>
                  </div>
                  <span className="text-[13px] text-[#8E8E93] shrink-0 ml-2">В ленте</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

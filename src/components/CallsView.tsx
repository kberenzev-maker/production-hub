import React, { useState } from 'react';
import { useProduction } from '../context/ProductionContext';
import { CallEvent } from '../types';
import { formatRussianDate } from '../utils/dateUtils';
import { generateWorkingCallLink, CallService } from '../utils/callLinkGenerator';
import { 
  Video, 
  Plus, 
  X, 
  Copy, 
  Check, 
  Trash2, 
  ExternalLink,
  Users
} from 'lucide-react';

export const CallsView: React.FC = () => {
  const { calls, currentExpertId, rescheduleCall, deleteCall, createCall, chatUsers } = useProduction();

  const [editingCallId, setEditingCallId] = useState<string | null>(null);
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');
  const [callToDelete, setCallToDelete] = useState<CallEvent | null>(null);
  const [copiedCallId, setCopiedCallId] = useState<string | null>(null);

  // Create Call Modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState(new Date().toISOString().slice(0, 10));
  const [newTime, setNewTime] = useState('14:00');
  const [newDuration, setNewDuration] = useState(45);
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>(['Кирилл (Продюсер)', 'Вера (Эксперт)']);
  const [newLink, setNewLink] = useState(() => generateWorkingCallLink('jitsi', 'sync'));

  const expertCalls = calls.filter(c => c.expertId === currentExpertId);

  const startReschedule = (call: CallEvent) => {
    setEditingCallId(call.id);
    setEditDate(call.date);
    setEditTime(call.time);
  };

  const handleSaveReschedule = (callId: string) => {
    if (editDate && editTime) {
      rescheduleCall(callId, editDate, editTime);
      setEditingCallId(null);
    }
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const workingLink = newLink.trim() && !newLink.includes('production-hub')
      ? newLink.trim()
      : generateWorkingCallLink('jitsi', newTitle.trim());

    createCall({
      title: newTitle.trim(),
      date: newDate,
      time: newTime,
      durationMinutes: Number(newDuration),
      participants: selectedParticipants.length > 0 ? selectedParticipants : ['Кирилл (Продюсер)', 'Вера (Эксперт)'],
      link: workingLink
    });

    setIsCreateModalOpen(false);
    setNewTitle('');
    setNewLink(generateWorkingCallLink('jitsi', 'sync'));
  };

  const toggleParticipant = (name: string) => {
    if (selectedParticipants.includes(name)) {
      setSelectedParticipants(prev => prev.filter(p => p !== name));
    } else {
      setSelectedParticipants(prev => [...prev, name]);
    }
  };

  const copyCallLink = (link: string, id: string) => {
    navigator.clipboard.writeText(link);
    setCopiedCallId(id);
    setTimeout(() => setCopiedCallId(null), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-between ml-4 mr-2">
        <h4 className="text-[13px] font-normal text-[#8E8E93] uppercase tracking-wider">
          Встречи ({expertCalls.length})
        </h4>
        <button
          type="button"
          onClick={() => {
            setNewLink(generateWorkingCallLink('jitsi', 'sync'));
            setIsCreateModalOpen(true);
          }}
          className="text-[13px] text-[#007AFF] font-medium flex items-center gap-1 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Назначить встречу</span>
        </button>
      </div>

      {/* iOS Inset Grouped Section */}
      <div className="bg-white rounded-[16px] divide-y divide-[#C6C6C8]/40 overflow-hidden">
        {expertCalls.length === 0 ? (
          <div className="p-8 text-center text-[#8E8E93]">
            <p className="text-[15px] font-medium text-black">Встреч нет</p>
          </div>
        ) : (
          expertCalls.map(call => {
            const isEditing = editingCallId === call.id;
            const isCopied = copiedCallId === call.id;

            return (
              <div key={call.id} className="p-4 space-y-2.5">
                {/* Main Row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-semibold text-[#007AFF]">
                        {formatRussianDate(call.date, true)} в {call.time}
                      </span>
                      <span className="text-[12px] text-[#8E8E93]">
                        {call.durationMinutes} мин
                      </span>
                    </div>

                    <h4 className="text-[16px] font-semibold text-black leading-snug">
                      {call.title}
                    </h4>

                    {call.participants && call.participants.length > 0 && (
                      <div className="flex items-center gap-1.5 text-[13px] text-[#8E8E93] pt-0.5">
                        <Users className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{call.participants.join(', ')}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions Right */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => copyCallLink(call.link, call.id)}
                      className="p-2 text-[#8E8E93] hover:text-[#007AFF] cursor-pointer rounded-[8px]"
                      title="Скопировать ссылку"
                    >
                      {isCopied ? <Check className="w-4 h-4 text-[#34C759]" /> : <Copy className="w-4 h-4" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => setCallToDelete(call)}
                      className="p-2 text-[#8E8E93] hover:text-[#FF3B30] cursor-pointer rounded-[8px]"
                      title="Удалить"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Reschedule Row if Editing */}
                {isEditing ? (
                  <div className="pt-2 border-t border-[#C6C6C8]/30 flex items-center gap-2">
                    <input
                      type="date"
                      dir="ltr"
                      value={editDate}
                      onChange={(e) => setEditDate(e.target.value)}
                      className="text-[13px] text-black bg-[#767680]/8 rounded-[8px] px-2.5 py-1.5 focus:outline-none"
                    />
                    <input
                      type="time"
                      dir="ltr"
                      value={editTime}
                      onChange={(e) => setEditTime(e.target.value)}
                      className="text-[13px] text-black bg-[#767680]/8 rounded-[8px] px-2.5 py-1.5 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleSaveReschedule(call.id)}
                      className="text-[13px] text-[#007AFF] font-semibold px-2 py-1 cursor-pointer"
                    >
                      Сохранить
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingCallId(null)}
                      className="text-[13px] text-[#8E8E93] px-2 py-1 cursor-pointer"
                    >
                      Отмена
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      onClick={() => startReschedule(call)}
                      className="text-[13px] text-[#007AFF] font-medium cursor-pointer"
                    >
                      Перенести
                    </button>

                    <a
                      href={call.link}
                      target="_blank"
                      rel="noreferrer"
                      className="h-8 px-3.5 bg-[#007AFF] text-white text-[13px] font-semibold rounded-[8px] flex items-center gap-1.5 hover:bg-[#007AFF]/90 transition-colors"
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span>Войти</span>
                      <ExternalLink className="w-3 h-3 ml-0.5" />
                    </a>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Create Call Modal (Apple Sheet style) */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <form onSubmit={handleCreateSubmit} className="bg-white rounded-t-[20px] sm:rounded-[20px] w-full max-w-md p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-[16px] font-semibold text-black">Новая встреча</h3>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
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
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Тема встречи"
                className="w-full px-3 py-2.5 text-[14px] text-black bg-[#767680]/8 rounded-[10px] focus:outline-none"
              />

              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  dir="ltr"
                  required
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="px-3 py-2 text-[13px] text-black bg-[#767680]/8 rounded-[10px] focus:outline-none"
                />
                <input
                  type="time"
                  dir="ltr"
                  required
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="px-3 py-2 text-[13px] text-black bg-[#767680]/8 rounded-[10px] focus:outline-none"
                />
              </div>

              {/* Duration Pills */}
              <div className="flex items-center gap-1.5">
                {[30, 45, 60].map(mins => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setNewDuration(mins)}
                    className={`flex-1 py-1.5 rounded-[8px] text-[13px] font-medium transition-colors cursor-pointer ${
                      newDuration === mins
                        ? 'bg-[#007AFF] text-white'
                        : 'bg-[#767680]/12 text-[#8E8E93]'
                    }`}
                  >
                    {mins} мин
                  </button>
                ))}
              </div>

              {/* Participants */}
              <div className="space-y-1.5">
                <span className="text-[12px] text-[#8E8E93] block">Участники:</span>
                <div className="flex flex-wrap gap-1.5">
                  {chatUsers.map(user => {
                    const isSelected = selectedParticipants.includes(user.name);
                    return (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => toggleParticipant(user.name)}
                        className={`px-2.5 py-1 rounded-full text-[12px] font-medium transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-[#007AFF] text-white'
                            : 'bg-[#767680]/12 text-[#8E8E93]'
                        }`}
                      >
                        {user.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Working Call Link */}
              <div className="space-y-1">
                <input
                  type="text"
                  dir="ltr"
                  required
                  value={newLink}
                  onChange={(e) => setNewLink(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 text-[13px] font-mono text-black bg-[#767680]/8 rounded-[10px] focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="flex-1 h-11 bg-[#767680]/12 text-[#007AFF] font-semibold text-[15px] rounded-[12px] cursor-pointer"
              >
                Отмена
              </button>
              <button
                type="submit"
                className="flex-1 h-11 bg-[#007AFF] text-white font-semibold text-[15px] rounded-[12px] cursor-pointer"
              >
                Назначить
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Confirmation Sheet */}
      {callToDelete && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="bg-white rounded-t-[20px] sm:rounded-[20px] w-full max-w-sm p-5 space-y-3">
            <h3 className="text-[16px] font-semibold text-black">Удалить встречу?</h3>
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

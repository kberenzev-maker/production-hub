import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useProduction } from '../context/ProductionContext';
import { UserRole } from '../types';
import { X, UserPlus, Shield, Check, Users, MessageSquare } from 'lucide-react';

interface TeamManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TeamManagementModal: React.FC<TeamManagementModalProps> = ({ isOpen, onClose }) => {
  const { chatUsers, updateUserRole, addChatUser } = useProduction();

  const [isAddingUser, setIsAddingUser] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('editor');
  const [newTitle, setNewTitle] = useState('');

  if (!isOpen) return null;
  if (typeof document === 'undefined') return null;

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newUsername.trim()) {
      addChatUser(newUsername.trim(), newName.trim() || newUsername.trim(), newRole, newTitle.trim());
      setNewUsername('');
      setNewName('');
      setNewTitle('');
      setIsAddingUser(false);
    }
  };

  const roleNames: Partial<Record<UserRole, { label: string; color: string; desc: string }>> = {
    super_admin: { label: 'Супер-админ (Продюсер)', color: 'bg-indigo-100 text-indigo-800 border-indigo-200', desc: 'Полный доступ, управление проектами, ролями и конвейером' },
    expert: { label: 'Эксперт', color: 'bg-rose-100 text-rose-800 border-rose-200', desc: 'Утверждение сценариев и приемка готовых рендеров' },
    editor: { label: 'Монтажер', color: 'bg-slate-100 text-slate-800 border-slate-300', desc: 'Скачивание дублей, загрузка рендеров и обложек' },
    designer: { label: 'Дизайнер', color: 'bg-amber-100 text-amber-800 border-amber-200', desc: 'Подготовка каруселей, обложек и инфографики' },
    publisher: { label: 'Публикатор', color: 'bg-emerald-100 text-emerald-800 border-emerald-200', desc: 'Тестирование 48 часов и выпуск в основную ленту' }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 my-auto">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base leading-tight">Участники чата и роли</h3>
              <p className="text-xs text-slate-500">
                Синхронизировано с участниками супергруппы Telegram
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1 min-h-0">
          {/* Top Info Banner */}
          <div className="p-3 bg-indigo-50/70 rounded-xl border border-indigo-100 text-xs text-indigo-900 flex items-start gap-2">
            <Shield className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Права доступа:</span> Назначенные роли определяют видимость разделов и доступные команды бота для каждого участника супергруппы.
            </div>
          </div>

          {/* User List */}
          <div className="space-y-2.5">
            {chatUsers.map(user => (
              <div 
                key={user.id}
                className="p-3 bg-white rounded-xl border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
                    alt={user.name}
                    className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">{user.name}</span>
                      <span className="text-xs text-indigo-600 font-mono font-semibold">{user.telegramUsername}</span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {user.customTitle || roleNames[user.role]?.desc || ''}
                    </div>
                  </div>
                </div>

                {/* Role Selector for this user */}
                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <span className="text-[11px] text-slate-400 font-medium sm:hidden">Роль:</span>
                  <select
                    value={user.role}
                    onChange={(e) => updateUserRole(user.id, e.target.value as UserRole)}
                    className="px-2.5 py-1.5 text-xs font-semibold border border-slate-200 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-800 cursor-pointer focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-colors"
                  >
                    <option value="super_admin">Супер-админ (Кирилл)</option>
                    <option value="expert">Эксперт (Вера)</option>
                    <option value="editor">Монтажер (Арсений)</option>
                    <option value="designer">Дизайнер (Марина)</option>
                    <option value="publisher">Публикатор (Даша)</option>
                  </select>
                </div>
              </div>
            ))}
          </div>

          {/* Add user form */}
          {isAddingUser ? (
            <form onSubmit={handleAddSubmit} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 animate-in fade-in">
              <div className="font-bold text-xs text-slate-800 uppercase tracking-wider">
                Добавить участника из чата Telegram
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Telegram Username
                  </label>
                  <input
                    type="text"
                    required
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder="@username"
                    className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Имя в команде
                  </label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Например: Иван"
                    className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Присвоить роль
                  </label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as UserRole)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="editor">Монтажер</option>
                    <option value="designer">Дизайнер</option>
                    <option value="publisher">Публикатор</option>
                    <option value="expert">Эксперт</option>
                    <option value="super_admin">Супер-админ</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Специализация / Должность
                  </label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Motion Designer / Копирайтер"
                    className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsAddingUser(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200/60 rounded-lg"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-xs"
                >
                  Добавить в команду
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setIsAddingUser(true)}
              className="w-full py-2.5 border-2 border-dashed border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 rounded-xl text-xs font-bold text-indigo-700 flex items-center justify-center gap-1.5 transition-all"
            >
              <UserPlus className="w-4 h-4" />
              Добавить участника из Telegram-чата
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-500">
            Всего участников: <b className="text-slate-800">{chatUsers.length}</b>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-lg shadow-xs cursor-pointer"
          >
            Готово
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
};

import React, { useState } from 'react';
import { Project, ProjectMember, TeamRole, TEAM_ROLES } from '../types';
import { Plus, Trash2, CheckCircle2, ShieldAlert, Sparkles, UserPlus } from 'lucide-react';

interface ProjectSetupModalProps {
  project: Project;
  onComplete: (members: ProjectMember[]) => void;
}

export const ProjectSetupModal: React.FC<ProjectSetupModalProps> = ({ project, onComplete }) => {
  // Initialize members with existing or default creator
  const [members, setMembers] = useState<ProjectMember[]>(() => {
    if (project.members && project.members.length > 0) {
      return project.members;
    }
    // Check Telegram WebApp user
    const tgUser = (window as any).Telegram?.WebApp?.initDataUnsafe?.user;
    const defaultName = tgUser 
      ? `${tgUser.first_name || ''} ${tgUser.last_name || ''}`.trim() || tgUser.username || 'Продюсер'
      : 'Продюсер';
    const defaultUsername = tgUser?.username ? `@${tgUser.username}` : undefined;

    return [
      {
        id: `member-${Date.now()}-1`,
        telegramUserId: tgUser?.id,
        name: defaultName,
        username: defaultUsername,
        roles: ['producer'],
        isCreator: true
      }
    ];
  });

  const [error, setError] = useState<string | null>(null);

  const handleAddMember = () => {
    setMembers(prev => [
      ...prev,
      {
        id: `member-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name: '',
        username: '',
        roles: []
      }
    ]);
  };

  const handleRemoveMember = (id: string) => {
    if (members.length <= 1) {
      setError('В проекте должен быть хотя бы один участник.');
      return;
    }
    setMembers(prev => prev.filter(m => m.id !== id));
  };

  const handleUpdateName = (id: string, name: string) => {
    setMembers(prev => prev.map(m => m.id === id ? { ...m, name } : m));
  };

  const handleUpdateUsername = (id: string, username: string) => {
    const formatted = username.startsWith('@') || !username ? username : `@${username}`;
    setMembers(prev => prev.map(m => m.id === id ? { ...m, username: formatted } : m));
  };

  const handleToggleRole = (memberId: string, role: TeamRole) => {
    setError(null);
    setMembers(prev => prev.map(m => {
      if (m.id !== memberId) return m;
      const hasRole = m.roles.includes(role);
      const newRoles = hasRole 
        ? m.roles.filter(r => r !== role)
        : [...m.roles, role];
      return { ...m, roles: newRoles };
    }));
  };

  const handleSubmit = () => {
    // Validations
    for (const m of members) {
      if (!m.name.trim()) {
        setError('Укажите имя для каждого участника команды.');
        return;
      }
      if (m.roles.length === 0) {
        setError(`Выберите хотя бы одну роль для ${m.name}.`);
        return;
      }
    }

    const hasExpert = members.some(m => m.roles.includes('expert'));
    if (!hasExpert) {
      setError('В проекте должен быть назначен хотя бы один Эксперт.');
      return;
    }

    const hasProducer = members.some(m => m.roles.includes('producer'));
    if (!hasProducer) {
      setError('В проекте должен быть назначен хотя бы один Продюсер / админ.');
      return;
    }

    setError(null);
    onComplete(members);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header Card */}
      <div className="bg-white rounded-3xl border border-[#C6C6C8]/40 p-6 shadow-sm mb-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="px-2.5 py-1 rounded-full bg-[#007AFF]/10 text-[#007AFF] text-xs font-bold uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Шаг 2 из 2: Идентификация проекта</span>
          </span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-black tracking-tight mb-2">
          Команда проекта «{project.title}»
        </h1>
        <p className="text-sm text-[#8E8E93] leading-relaxed">
          Определите участников и их роли. Одному участнику можно выбрать <strong>несколько ролей</strong> — права суммируются. После назначения ролей конвейер будет активирован.
        </p>
      </div>

      {error && (
        <div className="bg-[#FF3B30]/10 border border-[#FF3B30]/20 text-[#FF3B30] text-sm px-4 py-3 rounded-2xl flex items-center gap-2.5 mb-5 font-medium">
          <ShieldAlert className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Members List */}
      <div className="space-y-4 mb-6">
        {members.map((member, index) => (
          <div 
            key={member.id}
            className="bg-white rounded-3xl border border-[#C6C6C8]/40 p-5 shadow-sm transition-all"
          >
            {/* Top row: Name, Username, Remove */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div className="flex-1 flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={member.name}
                  onChange={(e) => handleUpdateName(member.id, e.target.value)}
                  placeholder="Имя (напр. Вера, Кирилл)"
                  className="px-3.5 py-2 rounded-xl bg-[#F2F2F7] text-black text-sm font-semibold border-none focus:outline-none focus:ring-2 focus:ring-[#007AFF]/40"
                />
                <input
                  type="text"
                  value={member.username || ''}
                  onChange={(e) => handleUpdateUsername(member.id, e.target.value)}
                  placeholder="@username в Telegram"
                  className="px-3.5 py-2 rounded-xl bg-[#F2F2F7] text-[#8E8E93] text-sm border-none focus:outline-none focus:ring-2 focus:ring-[#007AFF]/40"
                />
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {member.isCreator && (
                  <span className="text-[11px] font-semibold px-2.5 py-1 bg-[#007AFF]/10 text-[#007AFF] rounded-full">
                    Создатель
                  </span>
                )}
                {members.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveMember(member.id)}
                    className="w-8 h-8 rounded-full bg-[#FF3B30]/10 text-[#FF3B30] hover:bg-[#FF3B30]/20 flex items-center justify-center transition-colors cursor-pointer"
                    title="Удалить участника"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Role Chips Multi-Select */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#8E8E93] mb-2.5">
                Роли участника (выберите одну или несколько):
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {TEAM_ROLES.map((roleDef) => {
                  const isSelected = member.roles.includes(roleDef.id);
                  return (
                    <button
                      key={roleDef.id}
                      type="button"
                      onClick={() => handleToggleRole(member.id, roleDef.id)}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold text-left transition-all cursor-pointer flex flex-col justify-between border ${
                        isSelected 
                          ? 'border-transparent shadow-sm'
                          : 'border-[#C6C6C8]/40 bg-[#F2F2F7]/50 text-[#8E8E93] hover:bg-[#F2F2F7]'
                      }`}
                      style={{
                        backgroundColor: isSelected ? roleDef.bgLightColor : undefined,
                        color: isSelected ? roleDef.badgeColor : undefined,
                        borderColor: isSelected ? roleDef.badgeColor : undefined
                      }}
                    >
                      <div className="flex items-center justify-between w-full mb-0.5">
                        <span className="font-bold">{roleDef.shortLabel}</span>
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />}
                      </div>
                      <span className="text-[10px] opacity-75 line-clamp-1 font-normal">
                        {roleDef.description}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Member Button */}
      <button
        type="button"
        onClick={handleAddMember}
        className="w-full py-3 rounded-2xl border-2 border-dashed border-[#007AFF]/30 text-[#007AFF] hover:bg-[#007AFF]/5 active:scale-[0.99] font-semibold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer mb-6"
      >
        <UserPlus className="w-4 h-4" />
        <span>+ Добавить участника в команду</span>
      </button>

      {/* Complete Button */}
      <div className="sticky bottom-6">
        <button
          type="button"
          onClick={handleSubmit}
          className="w-full py-4 rounded-2xl bg-[#007AFF] hover:bg-[#007AFF]/90 active:scale-[0.98] text-white font-bold text-[16px] shadow-lg shadow-[#007AFF]/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
          <span>Завершить идентификацию и открыть проект</span>
        </button>
      </div>
    </div>
  );
};

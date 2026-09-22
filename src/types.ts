export type ContentType = 'reels' | 'carousel' | 'stories';

export type TaskProcessType = 
  | 'script' 
  | 'editing' 
  | 'design' 
  | 'shooting' 
  | 'publish' 
  | 'trial'
  | 'сценарий'
  | 'монтаж'
  | 'дизайн'
  | 'съёмка'
  | 'публикация'
  | 'пробные';

export type KanbanColumnId = 'idea' | 'script' | 'shooting' | 'development' | 'delivered';

export const getTaskStage = (task: TaskCard): KanbanColumnId => {
  if (task.kind === 'non_content') return 'idea';
  if (task.editingStatus === 'green') return 'delivered';
  if (task.editingStatus === 'yellow' || (task.shootingStatus === 'green' && task.type === 'reels')) return 'development';
  if (task.shootingStatus === 'yellow' || (task.scriptStatus === 'green' && task.type === 'reels')) return 'shooting';
  if (task.scriptStatus === 'yellow' || (task.scriptStatus === 'green' && task.type !== 'reels')) return 'script';
  return 'idea';
};

export type WeekDayShort = 'пн' | 'вт' | 'ср' | 'чт' | 'пт' | 'сб' | '-';

export interface WeeklyPlannerSchedule {
  scripts: WeekDayShort[];
  shootings: WeekDayShort[];
  editingDesign: WeekDayShort[];
  trials: WeekDayShort[];
  publication: ('вт' | 'чт')[]; // ВСЕГДА вт, чт
  stories: WeekDayShort[];
}

export type TeamRole = 
  | 'expert'        // Эксперт
  | 'producer'      // Продюсер / админ (тот кто добавил)
  | 'designer'      // Дизайнер
  | 'reelsmaker'    // Рилсмейкер
  | 'assistant'     // Ассистент
  | 'pm'            // Проектный менеджер
  | 'cameraman'     // Оператор
  | 'smm';          // СММ

export interface RoleDefinition {
  id: TeamRole;
  label: string;
  shortLabel: string;
  badgeColor: string;
  bgLightColor: string;
  description: string;
}

export const TEAM_ROLES: RoleDefinition[] = [
  { id: 'expert', label: 'Эксперт', shortLabel: 'Эксперт', badgeColor: '#FF9500', bgLightColor: 'rgba(255, 149, 0, 0.12)', description: 'Запись идей, утверждение сценариев, съемка' },
  { id: 'producer', label: 'Продюсер / админ', shortLabel: 'Продюсер', badgeColor: '#007AFF', bgLightColor: 'rgba(0, 122, 255, 0.12)', description: 'Управление проектом, стратегия, созвоны' },
  { id: 'pm', label: 'Проектный менеджер', shortLabel: 'PM', badgeColor: '#5856D6', bgLightColor: 'rgba(88, 86, 214, 0.12)', description: 'Координация пайплайна, дедлайны, контроль задач' },
  { id: 'reelsmaker', label: 'Рилсмейкер', shortLabel: 'Рилсмейкер', badgeColor: '#34C759', bgLightColor: 'rgba(52, 199, 89, 0.12)', description: 'Монтаж вертикальных видео, динамика, звук' },
  { id: 'designer', label: 'Дизайнер', shortLabel: 'Дизайнер', badgeColor: '#AF52DE', bgLightColor: 'rgba(175, 82, 222, 0.12)', description: 'Обложки, карусели, визуал, сторис-шаблоны' },
  { id: 'cameraman', label: 'Оператор', shortLabel: 'Оператор', badgeColor: '#FF2D55', bgLightColor: 'rgba(255, 45, 85, 0.12)', description: 'Съемка материала, свет, дубли и исходники' },
  { id: 'smm', label: 'СММ', shortLabel: 'СММ', badgeColor: '#32ADE6', bgLightColor: 'rgba(50, 173, 230, 0.12)', description: 'Публикация контента, копирайтинг, аналитика' },
  { id: 'assistant', label: 'Ассистент', shortLabel: 'Ассистент', badgeColor: '#8E8E93', bgLightColor: 'rgba(142, 142, 147, 0.12)', description: 'Организационные задачи, сбор материалов, помощь' }
];

export interface ProjectMember {
  id: string;
  telegramUserId?: number;
  name: string;
  username?: string;
  roles: TeamRole[]; // Multiple roles per person, rights sum up
  avatar?: string;
  isCreator?: boolean;
}

export type UserRole = TeamRole | 'super_admin' | 'editor' | 'publisher';

export type TagColor = 
  | 'reels'           // Фиолетовый
  | 'carousel'        // Синий
  | 'stories'         // Оранжевый
  | 'test'            // Бирюзовый (Пробный)
  | 'shooting'        // Красный (Съемка)
  | 'idea'            // Серый (Идея)
  | 'no_script'       // Желтый (Нет сценария)
  | 'editing'         // Серый металлик / Индиго (Монтаж)
  | 'design'          // Коричневый (Дизайн)
  | 'rest';           // Мятный / Зеленый (Отдых)

export type ChecklistStatus = 'gray' | 'yellow' | 'green';

export interface MaterialPool {
  id: string;
  poolNumber: 1 | 2 | number;
  name: string;
  filesCount: number;
  telegramChatLink: string;
  uploadedAt: string;
  note?: string;
}

export interface IdeaSupplement {
  id: string;
  type: 'voice' | 'video' | 'text' | 'image';
  title: string;
  telegramLink?: string;
  addedAt: string;
  note?: string;
}

export interface ReferenceItem {
  id: string;
  url: string;
  platform: 'youtube' | 'instagram' | 'tiktok' | 'pinterest' | 'other';
  title?: string;
}

export interface VoiceNoteItem {
  id: string;
  url: string;
  duration?: number;
  senderName?: string;
  textTranscript?: string;
  createdAt: string;
}

export interface ProjectTopics {
  ideas?: number;         // 1. ⚡ Идеи и подборки
  scripts?: number;       // 2. 📝 Сценарии
  shooting?: number;      // 3. 🎬 Съёмка
  materials?: number;     // 4. 📁 Материалы
  reels?: number;         // 5. 📱 Рилсы
  carousels?: number;     // 6. 🎠 Карусели
  stories?: number;       // 7. 👀 Сторис
  publications?: number;  // 8. 📣 Публикации
  calls?: number;         // 🎙️ Созвоны
}

export interface Project {
  id: string; // e.g. "-1002145893201" or "proj_default"
  chatId?: number;
  title: string;
  username?: string;
  topics?: ProjectTopics;
  members?: ProjectMember[];
  isSetupComplete?: boolean; // True when roles identification is completed
  createdAt: string;
  updatedAt: string;
}

export type PlacementType = 'trial' | 'main_feed' | 'unassigned' | 'archived';

export type TaskKind = 'content' | 'non_content';

export interface SubTask {
  id: string;
  title: string;
  status: 'todo' | 'in_progress' | 'done';
  assignedTo?: string; // Имя ответственного
  assignedAvatar?: string; // Аватарка ответственного
  dueDate?: string;
  createdAt?: string;
}

export const NON_CONTENT_CATEGORIES = [
  'Сайт',
  'Кастдевы',
  'Опросы',
  'Аналитика',
  'Маркетинг',
  'Воронка',
  'Инфраструктура',
  'Другое',
] as const;

export interface TaskCard {
  id: string; // e.g. "042" -> displayed as "#042"
  title: string;
  type: ContentType;
  kind?: TaskKind; // 'content' (default) | 'non_content' (сайт, кастдевы, опросы...)
  nonContentCategory?: string; // e.g. 'Сайт' | 'Кастдевы' | 'Опросы' | 'Маркетинг' | 'Аналитика' | 'Другое'
  nonContentStatus?: 'todo' | 'in_progress' | 'done';
  goal?: string; // Цель задачи
  description?: string; // Описание задачи
  ownerName?: string; // Ответственный (один, кто контролирует всю задачу)
  ownerAvatar?: string; // Аватарка контролирующего ответственного
  subtasks?: SubTask[]; // Подзадачи
  assignedTo?: string; // Ответственный участник
  taskCategory?: TaskProcessType; // сценарий, монтаж, дизайн, съёмка, публикация, пробные
  processType?: TaskProcessType; // сценарий, монтаж, дизайн, съёмка, публикация, пробные
  expertId: string; // e.g. "vera"
  expertName: string;
  
  // Status checklist
  scriptStatus: ChecklistStatus; // Gray (no text) / Yellow (draft) / Green (approved)
  shootingStatus: ChecklistStatus; // Gray (not set) / Yellow (date set) / Green (footage loaded)
  editingStatus: ChecklistStatus; // Gray (not started) / Yellow (in editing) / Green (render delivered)
  
  // Script content
  scriptText?: string;
  scriptUpdatedAt?: string;
  
  // Scheduling & Dates
  targetDueDate?: string; // YYYY-MM-DD: дата, к которой контент должен быть готов
  targetPublishDate?: string; // YYYY-MM-DD
  shootingDate?: string; // YYYY-MM-DD HH:mm
  
  // Materials & Footage pools
  materialsTotalCount: number;
  pools: MaterialPool[];
  
  // Idea attachments & supplements (войсы, видео, референсы в чате)
  ideaDescription?: string;
  hasVoiceNotes?: boolean;
  hasMediaReferences?: boolean;
  supplements?: IdeaSupplement[];
  telegramTopicMsgLink?: string;
  
  renderUrl?: string;
  coverUrl?: string;
  coverCommandSent?: boolean;
  coverNote?: string;
  renderDeliveredAt?: string;
  renderApprovedByExpert?: boolean;
  renderNeedsRevision?: boolean;
  revisionNotes?: string;
  
  // Publication stage
  placement: PlacementType;
  trialPublishedAt?: string; // ISO string when published in trial (48h timer)
  trialExpiresAt?: string;
  trialStartDate?: string; // Дата/время пробного режима
  trialScheduledDate?: string;
  finalPublishDate?: string; // Дата/время публикации
  captionText?: string;
  hashtags?: string;

  // Rejection/Discard fields
  rejected?: boolean;
  rejectedStage?: 'idea' | 'script' | 'video' | 'editing' | 'delivered';
  rejectedReason?: string;
  rejectedAt?: string;
  
  // Assignment
  assignedEditor?: string;
  assignedDesigner?: string;
  
  firstMaterialMsgLink?: string;
  firstMaterialMsgId?: number;
  references?: ReferenceItem[];
  voiceNotes?: VoiceNoteItem[];
  projectId?: string; // Связка с конкретным проектом/чатом
  
  isArchived?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ChatUser {
  id: string;
  telegramUsername: string; // e.g. "@kirill_prod"
  name: string;
  role: UserRole;
  avatar?: string;
  customTitle?: string;
}

export interface CallEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  time: string; // "15:00"
  durationMinutes: number;
  participants: string[];
  link: string;
  expertId: string;
  projectId?: string;
  topicMessageId?: number;
  reminded1h?: boolean;
  reminded15m?: boolean;
  participantUserIds?: string[];
}

export interface ProductionNorms {
  monthPlanReels: number;
  monthPlanCarousels: number;
  monthPlanStories: number;
  reelsBufferTarget?: number; // 2
  carouselsBufferTarget?: number; // 2
  bufferTarget: number;
}

export interface ProductionPulseStats {
  // Карусели (буфер 2 единицы)
  monthPlanCarousels: number;
  carouselsReady: number;
  carouselsBufferTarget: number; // 2 единицы
  carouselsBufferStock: number;
  isCarouselsBufferSafe: boolean;

  // Рилс (буфер 2 единицы)
  monthPlanReels: number;
  reelsReady: number;
  reelsBufferTarget: number; // 2 единицы
  reelsBufferStock: number;
  isReelsBufferSafe: boolean;

  // Сторис
  monthPlanStories: number;
  storiesReady: number;

  // Дополнительные показатели совместимости
  monthPlanFeed: number; // Reels + Carousels
  monthPaceFeedPerWeek: number;
  bufferTarget: number;
  bufferStockCount: number;
  bufferSafetyStatus: 'green' | 'yellow';
  totalActuallyReady: number;
  totalScriptsReady: number;
  totalIdeasInBank?: number;
  
  // Не контент
  nonContentTotalCount?: number;
  nonContentDoneCount?: number;
}

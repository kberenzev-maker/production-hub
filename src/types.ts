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

export type UserRole = 
  | 'super_admin'      // Кирилл / Продюсер
  | 'expert'           // Вера
  | 'editor'           // Монтажер
  | 'designer'         // Дизайнер
  | 'publisher';       // Ассистент-публикатор

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

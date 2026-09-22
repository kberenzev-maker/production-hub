import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { TaskCard, CallEvent, UserRole, TeamRole, ProjectMember, TEAM_ROLES, ProductionPulseStats, MaterialPool, PlacementType, ChatUser, ProductionNorms, WeeklyPlannerSchedule, TaskKind, ContentType, SubTask, Project } from '../types';
import { INITIAL_TASKS, INITIAL_CALLS, INITIAL_EXPERTS } from '../data/initialData';
import { formatDateToISO, formatRussianDate } from '../utils/dateUtils';
import { generateWorkingCallLink } from '../utils/callLinkGenerator';
import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  getDoc, 
  getDocs,
  writeBatch 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { syncService, SyncConnectionStatus } from '../lib/syncService';

interface ProductionContextType {
  // Projects (Multi-tenancy)
  projects: Project[];
  currentProjectId: string;
  setCurrentProjectId: (id: string) => void;
  currentProject: Project | null;
  completeProjectSetup: (projectId: string, members: ProjectMember[]) => void;
  updateProjectMembers: (projectId: string, members: ProjectMember[]) => void;
  currentUser: {
    id?: number;
    name: string;
    username?: string;
    roles: TeamRole[];
  };
  scaffoldProjectTopics: (chatId: number, chatTitle: string) => void;

  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  currentExpertId: string;
  setCurrentExpertId: (id: string) => void;
  experts: typeof INITIAL_EXPERTS;
  
  // Impersonation for super_admin
  impersonatedRole: UserRole | null;
  setImpersonatedRole: (role: UserRole | null) => void;
  activeRole: UserRole;

  // Project & Telegram info
  projectName: string;
  setProjectName: (name: string) => void;
  chatTitle: string;
  setChatTitle: (title: string) => void;
  telegramHandle: string;
  setTelegramHandle: (handle: string) => void;

  // Development mode & role switching in footer
  isDevModeActive: boolean;
  setIsDevModeActive: (active: boolean) => void;
  exitDevMode: () => void;

  // Norms & Buffer configuration (adjustable by super_admin)
  norms: ProductionNorms;
  updateNorms: (updates: Partial<ProductionNorms>) => void;

  // Weekly Planner
  weeklySchedule: WeeklyPlannerSchedule;
  updateWeeklySchedule: (updates: Partial<WeeklyPlannerSchedule>) => void;
  applyWeeklyPlanToSchedule: (schedule: WeeklyPlannerSchedule, markAsPlanned?: boolean) => void;
  isWeeklyPlannerOpen: boolean;
  setIsWeeklyPlannerOpen: (open: boolean) => void;
  isWeekPlanned: boolean;
  setIsWeekPlanned: (planned: boolean) => void;

  // Settings modal management
  isSettingsOpen: boolean;
  setIsSettingsOpen: (open: boolean) => void;
  settingsTab: 'norms' | 'project' | 'team' | 'schedule' | 'bot' | 'system';
  openSettings: (tab?: 'norms' | 'project' | 'team' | 'schedule' | 'bot' | 'system') => void;

  // Team & Chat Users
  chatUsers: ChatUser[];
  updateUserRole: (userId: string, newRole: UserRole) => void;
  addChatUser: (username: string, name: string, role: UserRole, customTitle?: string) => void;

  tasks: TaskCard[];
  calls: CallEvent[];
  stats: ProductionPulseStats;
  
  // Selection / Modals
  selectedTaskId: string | null;
  setSelectedTaskId: (id: string | null) => void;
  editingScriptTaskId: string | null;
  setEditingScriptTaskId: (id: string | null) => void;
  
  // Actions
  createIdea: (data: { title: string; type: 'reels' | 'carousel' | 'stories'; hasVoiceNotes?: boolean; hasMediaReferences?: boolean; note?: string; targetDueDate?: string }) => TaskCard;
  createTask: (data: {
    title: string;
    kind?: TaskKind;
    type?: ContentType;
    nonContentCategory?: string;
    assignedTo?: string;
    nonContentStatus?: 'todo' | 'in_progress' | 'done';
    goal?: string;
    description?: string;
    ownerName?: string;
    ownerAvatar?: string;
    hasVoiceNotes?: boolean;
    hasMediaReferences?: boolean;
    note?: string;
    targetDueDate?: string;
  }) => TaskCard;
  toggleNonContentTaskStatus: (taskId: string) => void;
  addSubtask: (taskId: string, title: string, assignedTo?: string, assignedAvatar?: string) => void;
  updateSubtaskStatus: (taskId: string, subtaskId: string, status: 'todo' | 'in_progress' | 'done') => void;
  updateMultipleSubtasksStatus: (taskId: string, subtaskIds: string[], status: 'todo' | 'in_progress' | 'done') => void;
  deleteSubtask: (taskId: string, subtaskId: string) => void;
  saveScriptDraft: (taskId: string, text: string) => void;
  approveScript: (taskId: string, text: string) => void;
  scheduleShooting: (taskId: string, date: string) => void;
  addFootagePool: (taskId: string, filesCount: number, poolNote?: string) => void;
  appendIdeaSupplement: (taskId: string, data: { type: 'voice' | 'video' | 'text' | 'image'; note: string; title?: string }) => void;
  submitRender: (taskId: string, renderUrl: string, coverUrl?: string) => void;
  attachRenderFromChat: (taskId: string, renderUrl: string, coverUrl?: string, note?: string) => void;
  attachCover: (taskId: string, coverUrl: string, note?: string) => void;
  reviewRender: (taskId: string, approved: boolean, revisionNotes?: string) => void;
  setPlacement: (taskId: string, placement: PlacementType) => void;
  setPublicationSchedule: (taskId: string, trialDate?: string, publishDate?: string) => void;
  rejectTask: (taskId: string, stage: 'idea' | 'script' | 'video' | 'editing' | 'delivered', reason: string) => void;
  restoreTask: (taskId: string) => void;
  moveTaskToStage: (taskId: string, targetStage: 'idea' | 'script' | 'shooting' | 'editing' | 'delivered') => void;
  markTrialPublished: (taskId: string) => void;
  promoteTrialToMain: (taskId: string) => void;
  archiveTask: (taskId: string) => void;
  deleteTask: (taskId: string) => void;
  updateTaskDetails: (taskId: string, updates: Partial<TaskCard>) => void;
  createCall: (data: { title: string; date: string; time: string; durationMinutes: number; participants: string[]; link?: string }) => void;
  rescheduleCall: (callId: string, newDate: string, newTime: string) => void;
  deleteCall: (callId: string) => void;
  clearAllTasks: () => void;
  resetAllData: () => void;
  isCloudSyncing: boolean;
  syncStatus: {
    status: SyncConnectionStatus;
    clientCount: number;
  };
  
  // Bot logs / Notifications for Topic Simulator
  botLogs: { id: string; time: string; topic: string; text: string; actionType?: string }[];
  addBotLog: (topic: string, text: string, actionType?: string) => void;
}

const ProductionContext = createContext<ProductionContextType | null>(null);

const STORAGE_KEY_TASKS = 'production_hub_tasks_v3';
const STORAGE_KEY_CALLS = 'production_hub_calls_v2';
const STORAGE_KEY_DB_CLEARED = 'production_hub_db_cleared_v3';
const STORAGE_KEY_ROLE = 'production_hub_role_v2';
const STORAGE_KEY_EXPERT = 'production_hub_expert_v2';
const STORAGE_KEY_USERS = 'production_hub_chat_users_v2';
const STORAGE_KEY_NORMS = 'production_hub_norms_v2';
const STORAGE_KEY_PROJECT = 'production_hub_project_name_v2';
const STORAGE_KEY_CHAT = 'production_hub_chat_title_v2';
const STORAGE_KEY_TG_HANDLE = 'production_hub_tg_handle_v2';

const DEFAULT_NORMS: ProductionNorms = {
  monthPlanReels: 8,
  monthPlanCarousels: 4,
  monthPlanStories: 8,
  bufferTarget: 4,
};

const INITIAL_CHAT_USERS: ChatUser[] = [
  { id: 'u1', telegramUsername: '@kirillber', name: 'Кирилл', role: 'super_admin', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', customTitle: 'Продюсер' },
  { id: 'u2', telegramUsername: '@vera_expert', name: 'Вера', role: 'expert', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80', customTitle: 'Эксперт' },
  { id: 'u3', telegramUsername: '@arseniy_editor', name: 'Арсений', role: 'editor', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80', customTitle: 'Монтажёр' },
  { id: 'u4', telegramUsername: '@marina_designer', name: 'Марина', role: 'designer', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80', customTitle: 'Дизайнер' },
  { id: 'u5', telegramUsername: '@dasha_publisher', name: 'Даша', role: 'publisher', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80', customTitle: 'Ассистент' },
  { id: 'u6', telegramUsername: '@gleb_cameraman', name: 'Глеб', role: 'editor', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80', customTitle: 'Видеограф / Съемка' },
  { id: 'u7', telegramUsername: '@alex_scripts', name: 'Алексей', role: 'editor', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80', customTitle: 'Сценарист' },
];

export const ProductionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProjectId, setCurrentProjectId] = useState<string>('');

  const currentProject = useMemo(() => {
    return projects.find(p => p.id === currentProjectId) || projects[0] || null;
  }, [projects, currentProjectId]);

  const completeProjectSetup = (projectId: string, members: ProjectMember[]) => {
    setProjects(prev => prev.map(p => {
      if (p.id === projectId) {
        const updated: Project = {
          ...p,
          members,
          isSetupComplete: true,
          updatedAt: new Date().toISOString()
        };
        syncService.sendProjectUpsert(updated);
        return updated;
      }
      return p;
    }));
  };

  const updateProjectMembers = (projectId: string, members: ProjectMember[]) => {
    setProjects(prev => prev.map(p => {
      if (p.id === projectId) {
        const updated: Project = {
          ...p,
          members,
          updatedAt: new Date().toISOString()
        };
        syncService.sendProjectUpsert(updated);
        return updated;
      }
      return p;
    }));
  };

  const currentUser = useMemo(() => {
    const tgUser = typeof window !== 'undefined' ? (window as any).Telegram?.WebApp?.initDataUnsafe?.user : null;
    const matchedMember = currentProject?.members?.find(m => 
      (tgUser?.id && m.telegramUserId === tgUser.id) ||
      (tgUser?.username && m.username?.toLowerCase() === `@${tgUser.username.toLowerCase()}`) ||
      (tgUser?.username && m.username?.toLowerCase() === tgUser.username.toLowerCase())
    );

    const name = tgUser
      ? `${tgUser.first_name || ''} ${tgUser.last_name || ''}`.trim() || tgUser.username || 'Пользователь'
      : (matchedMember?.name || 'Продюсер');
    const username = tgUser?.username ? `@${tgUser.username}` : (matchedMember?.username || '@producer');
    const roles: TeamRole[] = matchedMember?.roles && matchedMember.roles.length > 0 
      ? matchedMember.roles 
      : (currentProject?.members?.[0]?.roles || ['producer']);

    return {
      id: tgUser?.id,
      name,
      username,
      roles
    };
  }, [currentProject]);

  const scaffoldProjectTopics = (chatId: number, chatTitle: string) => {
    syncService.sendScaffoldProject(chatId, chatTitle);
    addBotLog('Проекты', `Запущена авторазвёртка 9 топиков для чата «${chatTitle}»`);
  };

  const [currentRole, setCurrentRole] = useState<UserRole>(() => {
    return (localStorage.getItem(STORAGE_KEY_ROLE) as UserRole) || 'super_admin';
  });

  const [impersonatedRole, setImpersonatedRole] = useState<UserRole | null>(null);
  const activeRole = impersonatedRole || currentRole;

  // Development mode in static footer
  const [isDevModeActive, setIsDevModeActive] = useState<boolean>(false);

  const exitDevMode = () => {
    setIsDevModeActive(false);
    setImpersonatedRole(null);
    setCurrentRole('super_admin');
  };

  // Project & Telegram Info
  const [projectName, setProjectName] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY_PROJECT) || '[project name]';
  });

  const [chatTitle, setChatTitle] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY_CHAT) || 'production_supergroup';
  });

  const [telegramHandle, setTelegramHandle] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY_TG_HANDLE) || 'kirillber';
  });

  // Production Norms & Buffer
  const [norms, setNorms] = useState<ProductionNorms>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_NORMS);
    if (saved) {
      try {
        return { ...DEFAULT_NORMS, ...JSON.parse(saved) };
      } catch {
        // fallback
      }
    }
    return DEFAULT_NORMS;
  });

  const updateNorms = (updates: Partial<ProductionNorms>) => {
    setNorms(prev => {
      const next = { ...prev, ...updates };
      localStorage.setItem(STORAGE_KEY_NORMS, JSON.stringify(next));
      return next;
    });
  };

  const DEFAULT_WEEKLY_SCHEDULE: WeeklyPlannerSchedule = {
    scripts: ['пн', 'вт', 'ср', 'чт', 'пт', 'сб'],
    shootings: ['вт', 'чт', 'сб'],
    editingDesign: ['пн', 'ср', 'пт'],
    trials: ['ср', 'пт'],
    publication: ['вт', 'чт'], // ВСЕГДА: вт, чт
    stories: ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', '-'],
  };

  const [weeklySchedule, setWeeklySchedule] = useState<WeeklyPlannerSchedule>(() => {
    const saved = localStorage.getItem('production_hub_weekly_v2');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return DEFAULT_WEEKLY_SCHEDULE;
  });

  const [isWeeklyPlannerOpen, setIsWeeklyPlannerOpen] = useState(false);

  const updateWeeklySchedule = (updates: Partial<WeeklyPlannerSchedule>) => {
    setWeeklySchedule(prev => {
      const next = { ...prev, ...updates, publication: ['вт', 'чт'] as ('вт' | 'чт')[] };
      localStorage.setItem('production_hub_weekly_v2', JSON.stringify(next));
      return next;
    });
  };

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PROJECT, projectName);
  }, [projectName]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_CHAT, chatTitle);
  }, [chatTitle]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_TG_HANDLE, telegramHandle);
  }, [telegramHandle]);

  const [currentExpertId, setCurrentExpertId] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY_EXPERT) || 'vera';
  });

  const [chatUsers, setChatUsers] = useState<ChatUser[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_USERS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return INITIAL_CHAT_USERS;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(chatUsers));
  }, [chatUsers]);

  // Clean serialization helper for Firestore (removes undefined)
  const cleanFirestoreData = (obj: any): any => {
    if (obj === null || obj === undefined) return null;
    if (typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) {
      return obj.map(item => cleanFirestoreData(item));
    }
    const cleaned: Record<string, any> = {};
    for (const [key, val] of Object.entries(obj)) {
      if (val !== undefined) {
        cleaned[key] = cleanFirestoreData(val);
      }
    }
    return cleaned;
  };

  const [isCloudSyncing, setIsCloudSyncing] = useState<boolean>(true);
  const [syncStatus, setSyncStatus] = useState<{
    status: SyncConnectionStatus;
    clientCount: number;
  }>({
    status: 'connecting',
    clientCount: 1
  });

  const [tasks, setTasks] = useState<TaskCard[]>(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY_DB_CLEARED) === 'true') {
        return [];
      }
      const saved = localStorage.getItem(STORAGE_KEY_TASKS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch {}
    return [];
  });

  const [calls, setCalls] = useState<CallEvent[]>(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY_DB_CLEARED) === 'true') {
        return [];
      }
      const saved = localStorage.getItem(STORAGE_KEY_CALLS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch {}
    return [];
  });

  // Direct sync helpers (Both WebSocket Realtime and Firestore)
  const syncTaskToFirestore = async (task: TaskCard) => {
    syncService.sendTaskUpsert(task);
    try {
      await setDoc(doc(db, 'tasks', task.id), cleanFirestoreData(task));
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `tasks/${task.id}`);
    }
  };

  const removeTaskFromFirestore = async (taskId: string) => {
    syncService.sendTaskDelete(taskId);
    try {
      await deleteDoc(doc(db, 'tasks', taskId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `tasks/${taskId}`);
    }
  };

  const syncCallToFirestore = async (call: CallEvent) => {
    syncService.sendCallUpsert(call);
    try {
      await setDoc(doc(db, 'calls', call.id), cleanFirestoreData(call));
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `calls/${call.id}`);
    }
  };

  const removeCallFromFirestore = async (callId: string) => {
    syncService.sendCallDelete(callId);
    try {
      await deleteDoc(doc(db, 'calls', callId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `calls/${callId}`);
    }
  };

  // Helper to update task in state and sync automatically to Firestore
  const updateTaskInState = (taskId: string, updater: (t: TaskCard) => TaskCard) => {
    let updatedTask: TaskCard | null = null;
    setTasks(prev => {
      const next = prev.map(t => {
        if (t.id === taskId) {
          updatedTask = updater(t);
          return updatedTask;
        }
        return t;
      });
      return next;
    });
    if (updatedTask) {
      syncTaskToFirestore(updatedTask);
    }
  };

  // Real-time synchronization via WebSocket server & shared JSON database
  useEffect(() => {
    syncService.init({
      onStatusChange: (status, clientCount) => {
        setSyncStatus({ status, clientCount });
      },
      onStateSnapshot: (data) => {
        if (data.tasks && data.tasks.length > 0) {
          localStorage.removeItem(STORAGE_KEY_DB_CLEARED);
          setTasks(data.tasks);
        } else {
          setTasks([]);
        }
        const projs = data.projects;
        if (projs && Array.isArray(projs)) {
          setProjects(projs);
          if (projs.length > 0 && projs[0]) {
            setCurrentProjectId(prev => prev || projs[0]!.id);
          }
        }
        if (data.calls && Array.isArray(data.calls)) {
          setCalls(data.calls);
        } else {
          setCalls([]);
        }
      },
      onProjectUpsert: (incomingProj) => {
        setProjects(prev => {
          const idx = prev.findIndex(p => p.id === incomingProj.id || p.chatId === incomingProj.chatId);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = incomingProj;
            return next;
          }
          return [...prev, incomingProj];
        });
        setCurrentProjectId(prev => prev || incomingProj.id);
      },
      onTaskUpsert: (incomingTask) => {
        setTasks(prev => {
          const idx = prev.findIndex(t => t.id === incomingTask.id);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = incomingTask;
            return next;
          }
          return [incomingTask, ...prev];
        });
      },
      onTaskDelete: (taskId) => {
        setTasks(prev => prev.filter(t => t.id !== taskId));
      },
      onCallUpsert: (incomingCall) => {
        setCalls(prev => {
          const idx = prev.findIndex(c => c.id === incomingCall.id);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = incomingCall;
            return next;
          }
          return [incomingCall, ...prev];
        });
      },
      onCallDelete: (callId) => {
        setCalls(prev => prev.filter(c => c.id !== callId));
      },
      onTasksCleared: () => {
        setTasks([]);
      },
      onStateReset: (data) => {
        setTasks(data.tasks || INITIAL_TASKS);
        setCalls(data.calls || INITIAL_CALLS);
      }
    });
  }, []);

  // Real-time synchronization with Firestore
  useEffect(() => {
    let isSubscribed = true;

    // Listen to tasks collection in real time
    const unsubscribeTasks = onSnapshot(collection(db, 'tasks'), async (snapshot) => {
      if (!isSubscribed) return;

      if (snapshot.empty) {
        try {
          const stateDoc = await getDoc(doc(db, 'system', 'state'));
          const isClearedInDb = stateDoc.exists() && stateDoc.data()?.isCleared;
          const isClearedLocally = localStorage.getItem(STORAGE_KEY_DB_CLEARED) === 'true';

          if (isClearedInDb || isClearedLocally) {
            localStorage.setItem(STORAGE_KEY_DB_CLEARED, 'true');
            setTasks([]);
            setIsCloudSyncing(false);
            return;
          }

          // First launch ever: populate Firestore with INITIAL_TASKS
          const batch = writeBatch(db);
          for (const t of INITIAL_TASKS) {
            batch.set(doc(db, 'tasks', t.id), cleanFirestoreData(t));
          }
          batch.set(doc(db, 'system', 'state'), { isCleared: false, seededAt: new Date().toISOString() });
          await batch.commit();
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, 'tasks');
        }
        setIsCloudSyncing(false);
        return;
      }

      // Firestore contains tasks - update state in real time for all users
      localStorage.removeItem(STORAGE_KEY_DB_CLEARED);
      const remoteTasks: TaskCard[] = [];
      snapshot.forEach(docSnap => {
        remoteTasks.push(docSnap.data() as TaskCard);
      });

      // Sort tasks: newest created first
      remoteTasks.sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        if (timeA !== timeB) return timeB - timeA;
        return (b.id || '').localeCompare(a.id || '');
      });

      setTasks(remoteTasks);
      setIsCloudSyncing(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'tasks');
      setIsCloudSyncing(false);
    });

    // Listen to calls collection in real time
    const unsubscribeCalls = onSnapshot(collection(db, 'calls'), async (snapshot) => {
      if (!isSubscribed) return;

      if (snapshot.empty) {
        try {
          const stateDoc = await getDoc(doc(db, 'system', 'state'));
          const isClearedInDb = stateDoc.exists() && stateDoc.data()?.isCleared;
          const isClearedLocally = localStorage.getItem(STORAGE_KEY_DB_CLEARED) === 'true';

          if (isClearedInDb || isClearedLocally) {
            setCalls([]);
            return;
          }

          const batch = writeBatch(db);
          for (const c of INITIAL_CALLS) {
            batch.set(doc(db, 'calls', c.id), cleanFirestoreData(c));
          }
          await batch.commit();
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, 'calls');
        }
        return;
      }

      const remoteCalls: CallEvent[] = [];
      snapshot.forEach(docSnap => {
        remoteCalls.push(docSnap.data() as CallEvent);
      });
      setCalls(remoteCalls);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'calls');
    });

    return () => {
      isSubscribed = false;
      unsubscribeTasks();
      unsubscribeCalls();
    };
  }, []);

  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [editingScriptTaskId, setEditingScriptTaskId] = useState<string | null>(null);
  
  const [botLogs, setBotLogs] = useState<{ id: string; time: string; topic: string; text: string; actionType?: string }[]>([
    {
      id: 'log-0',
      time: '14:20',
      topic: 'Идеи',
      text: 'Идея #049: «Психологический барьер» зафиксирована ботом с вложениями голосовых заметок.',
      actionType: 'idea'
    },
    {
      id: 'log-1',
      time: '15:40',
      topic: 'Съемка/Материалы',
      text: 'Материалы к ролику #042 приняты в работу (Пул 2 сформирован, всего 16 файлов). Назначен монтажер Арсений.',
      actionType: 'materials'
    },
    {
      id: 'log-2',
      time: '18:10',
      topic: 'Публикация',
      text: 'Ролик #041 выложен в пробные. Запущен таймер 48 часов теста.',
      actionType: 'publish'
    }
  ]);

  const addBotLog = (topic: string, text: string, actionType?: string) => {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    setBotLogs(prev => [{
      id: `log-${Date.now()}`,
      time: timeStr,
      topic,
      text,
      actionType
    }, ...prev.slice(0, 24)]);
  };

  // Persist to local storage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_CALLS, JSON.stringify(calls));
  }, [calls]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_ROLE, currentRole);
  }, [currentRole]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_EXPERT, currentExpertId);
  }, [currentExpertId]);

  // Week planning state
  const [isWeekPlanned, setIsWeekPlanned] = useState<boolean>(() => {
    return localStorage.getItem('production_hub_week_planned_v1') === 'true';
  });

  // Settings modal state
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [settingsTab, setSettingsTab] = useState<'norms' | 'project' | 'team' | 'schedule' | 'bot' | 'system'>('norms');

  const openSettings = (tab: 'norms' | 'project' | 'team' | 'schedule' | 'bot' | 'system' = 'norms') => {
    setSettingsTab(tab);
    setIsSettingsOpen(true);
  };

  const applyWeeklyPlanToSchedule = (schedule: WeeklyPlannerSchedule, markAsPlanned: boolean = true) => {
    const updated = { ...schedule, publication: ['вт', 'чт'] as ('вт' | 'чт')[] };
    setWeeklySchedule(updated);
    localStorage.setItem('production_hub_weekly_v2', JSON.stringify(updated));

    if (markAsPlanned) {
      setIsWeekPlanned(true);
      localStorage.setItem('production_hub_week_planned_v1', 'true');
    }

    addBotLog(
      'План недели',
      `План недели успешно применен! Дни съемок: ${updated.shootings?.map(d => d.toUpperCase()).join(', ')}. Дни релизов: ВТ, ЧТ. Синхронизировано с календарем.`,
      'schedule_applied'
    );
  };

  // Production Pulse analytics calculation
  const stats = useMemo<ProductionPulseStats>(() => {
    // Exclude archived AND rejected tasks so they never count towards plan / progress
    const expertTasks = tasks.filter(t => t.expertId === currentExpertId && !t.isArchived && !t.rejected);
    
    // Content tasks vs Non-content tasks
    const contentTasks = expertTasks.filter(t => t.kind !== 'non_content');
    const nonContentTasks = expertTasks.filter(t => t.kind === 'non_content');

    const ideasInBank = contentTasks.filter(t => 
      t.placement !== 'main_feed' && 
      (t.scriptStatus === 'gray' || !t.scriptStatus) &&
      !(t.scriptText && t.scriptText.trim().length > 0) &&
      t.shootingStatus !== 'green' &&
      t.editingStatus !== 'green'
    ).length;
    const scriptsReady = contentTasks.filter(t => t.scriptStatus === 'green').length;
    const actuallyReady = contentTasks.filter(t => t.editingStatus === 'green').length;

    // 1. Карусели (буфер 2 единицы)
    const carouselsPlan = norms.monthPlanCarousels || 4;
    const carouselsReady = contentTasks.filter(t => t.type === 'carousel' && t.editingStatus === 'green').length;
    const carouselsBufferTarget = 2; // Буфер 2 единицы
    const carouselsBufferStock = carouselsReady;
    const isCarouselsBufferSafe = carouselsBufferStock >= carouselsBufferTarget;

    // 2. Рилс (буфер 2 единицы)
    const reelsPlan = norms.monthPlanReels || 8;
    const reelsReady = contentTasks.filter(t => t.type === 'reels' && t.editingStatus === 'green').length;
    const reelsBufferTarget = 2; // Буфер 2 единицы
    const reelsBufferStock = reelsReady;
    const isReelsBufferSafe = reelsBufferStock >= reelsBufferTarget;

    // 3. Сторис (план и факт)
    const storiesPlan = norms.monthPlanStories || 8;
    const storiesReady = contentTasks.filter(t => t.type === 'stories' && t.editingStatus === 'green').length;

    // Non-content tasks summary
    const nonContentDoneCount = nonContentTasks.filter(t => t.nonContentStatus === 'done').length;

    const totalBufferStock = carouselsBufferStock + reelsBufferStock;
    const isTotalBufferSafe = isCarouselsBufferSafe && isReelsBufferSafe;

    return {
      // Карусели (буфер 2 единицы)
      monthPlanCarousels: carouselsPlan,
      carouselsReady,
      carouselsBufferTarget,
      carouselsBufferStock,
      isCarouselsBufferSafe,

      // Рилс (буфер 2 единицы)
      monthPlanReels: reelsPlan,
      reelsReady,
      reelsBufferTarget,
      reelsBufferStock,
      isReelsBufferSafe,

      // Сторис
      monthPlanStories: storiesPlan,
      storiesReady,

      // Совместимость
      monthPlanFeed: carouselsPlan + reelsPlan,
      monthPaceFeedPerWeek: Math.round((carouselsPlan + reelsPlan) / 4),
      bufferTarget: 4,
      bufferStockCount: totalBufferStock,
      bufferSafetyStatus: isTotalBufferSafe ? 'green' : 'yellow',
      totalActuallyReady: actuallyReady,
      totalScriptsReady: scriptsReady,
      totalIdeasInBank: ideasInBank,

      nonContentTotalCount: nonContentTasks.length,
      nonContentDoneCount,
    };
  }, [tasks, currentExpertId, norms]);

  // Actions
  const createTask = ({ 
    title, 
    kind = 'content',
    type = 'reels', 
    nonContentCategory = 'Сайт',
    assignedTo = 'Кирилл (Продюсер)',
    nonContentStatus = 'todo',
    goal,
    description,
    ownerName,
    ownerAvatar,
    hasVoiceNotes, 
    hasMediaReferences, 
    note, 
    targetDueDate 
  }: { 
    title: string; 
    kind?: TaskKind;
    type?: ContentType; 
    nonContentCategory?: string;
    assignedTo?: string;
    nonContentStatus?: 'todo' | 'in_progress' | 'done';
    goal?: string;
    description?: string;
    ownerName?: string;
    ownerAvatar?: string;
    hasVoiceNotes?: boolean; 
    hasMediaReferences?: boolean; 
    note?: string; 
    targetDueDate?: string; 
  }) => {
    // Generate next unique #ID
    const existingIds = tasks.map(t => parseInt(t.id, 10)).filter(n => !isNaN(n));
    const nextNum = existingIds.length > 0 ? Math.max(...existingIds) + 1 : 50;
    const newId = String(nextNum).padStart(3, '0');
    
    const expert = INITIAL_EXPERTS.find(e => e.id === currentExpertId) || INITIAL_EXPERTS[0];
    const defaultUser = chatUsers.find(u => u.name === assignedTo || u.name === ownerName) || chatUsers[0];
    
    const newTask: TaskCard = {
      id: newId,
      title: title.trim(),
      type: kind === 'content' ? type : 'reels',
      kind,
      nonContentCategory: kind === 'non_content' ? (nonContentCategory || 'Операционная') : undefined,
      nonContentStatus: kind === 'non_content' ? nonContentStatus : undefined,
      goal: kind === 'non_content' ? (goal?.trim() || title.trim()) : undefined,
      description: kind === 'non_content' ? (description?.trim() || note?.trim() || '') : undefined,
      ownerName: kind === 'non_content' ? (ownerName || assignedTo || defaultUser?.name || 'Кирилл') : undefined,
      ownerAvatar: kind === 'non_content' ? (ownerAvatar || defaultUser?.avatar) : undefined,
      subtasks: [],
      assignedTo: kind === 'non_content' ? assignedTo : undefined,
      ideaDescription: note || '',
      targetDueDate: targetDueDate || undefined,
      expertId: currentExpertId,
      expertName: expert.name,
      scriptStatus: 'gray',
      shootingStatus: 'gray',
      editingStatus: 'gray',
      materialsTotalCount: 0,
      pools: [],
      hasVoiceNotes: !!hasVoiceNotes,
      hasMediaReferences: !!hasMediaReferences,
      telegramTopicMsgLink: `https://t.me/c/2145893201/${1100 + nextNum}`,
      placement: 'unassigned',
      projectId: currentProjectId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    setTasks(prev => [newTask, ...prev]);
    syncTaskToFirestore(newTask);
    const typeLabel = kind === 'non_content' ? `[НЕ КОНТЕНТ: ${nonContentCategory || 'Задача'}]` : `[${type.toUpperCase()}]`;
    addBotLog(
      kind === 'non_content' ? 'Операционная задача' : 'Контент',
      `Задача #${newId}: «${title}» ${typeLabel} создана и добавлена в рабочий процесс.`,
      kind === 'non_content' ? 'task_non_content' : 'task_content'
    );
    return newTask;
  };

  const addSubtask = (taskId: string, subtaskTitle: string, assignedTo?: string, assignedAvatar?: string) => {
    if (!subtaskTitle.trim()) return;
    const defaultUser = chatUsers.find(u => u.name === assignedTo) || chatUsers[0];
    const newSubtask: SubTask = {
      id: `sub-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      title: subtaskTitle.trim(),
      status: 'todo',
      assignedTo: assignedTo || defaultUser?.name || 'Кирилл',
      assignedAvatar: assignedAvatar || defaultUser?.avatar,
      createdAt: new Date().toISOString(),
    };

    updateTaskInState(taskId, t => {
      const currentSubtasks = t.subtasks || [];
      return {
        ...t,
        subtasks: [...currentSubtasks, newSubtask],
        updatedAt: new Date().toISOString(),
      };
    });
    addBotLog('Задачи', `Добавлена подзадача «${subtaskTitle}» к задаче #${taskId}`);
  };

  const updateSubtaskStatus = (taskId: string, subtaskId: string, status: 'todo' | 'in_progress' | 'done') => {
    updateTaskInState(taskId, t => {
      const currentSubtasks = t.subtasks || [];
      const updatedSubtasks = currentSubtasks.map(st => st.id === subtaskId ? { ...st, status } : st);
      const allDone = updatedSubtasks.length > 0 && updatedSubtasks.every(st => st.status === 'done');
      const anyInProgress = updatedSubtasks.some(st => st.status === 'in_progress' || st.status === 'done');
      const nextStatus: 'todo' | 'in_progress' | 'done' = allDone ? 'done' : anyInProgress ? 'in_progress' : 'todo';
      return {
        ...t,
        subtasks: updatedSubtasks,
        nonContentStatus: nextStatus,
        editingStatus: 'gray',
        updatedAt: new Date().toISOString(),
      };
    });
  };

  const updateMultipleSubtasksStatus = (taskId: string, subtaskIds: string[], status: 'todo' | 'in_progress' | 'done') => {
    if (subtaskIds.length === 0) return;
    const targetSet = new Set(subtaskIds);
    updateTaskInState(taskId, t => {
      const currentSubtasks = t.subtasks || [];
      const updatedSubtasks = currentSubtasks.map(st => targetSet.has(st.id) ? { ...st, status } : st);
      const allDone = updatedSubtasks.length > 0 && updatedSubtasks.every(st => st.status === 'done');
      const anyInProgress = updatedSubtasks.some(st => st.status === 'in_progress' || st.status === 'done');
      const nextStatus: 'todo' | 'in_progress' | 'done' = allDone ? 'done' : anyInProgress ? 'in_progress' : 'todo';
      return {
        ...t,
        subtasks: updatedSubtasks,
        nonContentStatus: nextStatus,
        editingStatus: 'gray',
        updatedAt: new Date().toISOString(),
      };
    });
    const statusRu = status === 'done' ? '«Выполнено»' : status === 'in_progress' ? '«В работе»' : '«К выполнению»';
    addBotLog('Задачи', `Массовое обновление: ${subtaskIds.length} подзадач переведены в статус ${statusRu} в задаче #${taskId}`);
  };

  const deleteSubtask = (taskId: string, subtaskId: string) => {
    updateTaskInState(taskId, t => ({
      ...t,
      subtasks: (t.subtasks || []).filter(st => st.id !== subtaskId),
      updatedAt: new Date().toISOString(),
    }));
  };

  const toggleNonContentTaskStatus = (taskId: string) => {
    updateTaskInState(taskId, t => {
      const nextStatus = t.nonContentStatus === 'done' ? 'todo' : 'done';
      return {
        ...t,
        nonContentStatus: nextStatus,
        editingStatus: 'gray',
        updatedAt: new Date().toISOString()
      };
    });
  };

  const createIdea = (data: { 
    title: string; 
    type: 'reels' | 'carousel' | 'stories'; 
    hasVoiceNotes?: boolean; 
    hasMediaReferences?: boolean; 
    note?: string; 
    targetDueDate?: string; 
  }) => {
    return createTask({ ...data, kind: 'content' });
  };

  const saveScriptDraft = (taskId: string, text: string) => {
    updateTaskInState(taskId, t => ({
      ...t,
      scriptText: text,
      scriptStatus: 'yellow',
      scriptUpdatedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));
    addBotLog('Сценарии', `Черновик сценария #${taskId} сохранен.`);
  };

  const approveScript = (taskId: string, text: string) => {
    const targetTask = tasks.find(t => t.id === taskId);
    updateTaskInState(taskId, t => ({
      ...t,
      scriptText: text,
      scriptStatus: 'green',
      scriptUpdatedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));
    
    if (targetTask?.type === 'reels') {
      addBotLog(
        'Съемка/Материалы',
        `Сценарий #${taskId} утвержден! Запрос к эксперту @${targetTask.expertName} на выбор слота съемки.`,
        'script_approved'
      );
    } else {
      addBotLog(
        'Дизайн',
        `Сценарий #${taskId} утвержден! Карточка передана дизайнеру в работу.`,
        'script_approved'
      );
    }
  };

  const scheduleShooting = (taskId: string, date: string) => {
    const target = tasks.find(t => t.id === taskId);
    if (target && (!target.scriptText || target.scriptText.trim().length === 0)) {
      alert('Назначить съёмку можно только после того, как сценарий будет написан.');
      return;
    }

    let adjustedDueDate = target?.targetDueDate;
    let dueDateChanged = false;

    // Validate that shooting leaves at least 3 days before deadline
    if (target?.targetDueDate && date) {
      const shootD = new Date(date.slice(0, 10));
      const dueD = new Date(target.targetDueDate.slice(0, 10));
      const diff = Math.round((dueD.getTime() - shootD.getTime()) / (1000 * 60 * 60 * 24));
      if (diff < 3) {
        // Automatically shift targetDueDate to shootingDate + 3 days to preserve 3-day buffer!
        const newDue = new Date(shootD);
        newDue.setDate(newDue.getDate() + 3);
        adjustedDueDate = formatDateToISO(newDue);
        dueDateChanged = true;
      }
    }

    updateTaskInState(taskId, t => ({
      ...t,
      shootingDate: date,
      shootingStatus: 'yellow', // date fixed!
      targetDueDate: adjustedDueDate,
      updatedAt: new Date().toISOString(),
    }));

    if (dueDateChanged) {
      addBotLog(
        'Съемка/Материалы',
        `Слот съемки #${taskId} назначен на ${date}. Дедлайн ролика автоматически сдвинут на ${formatRussianDate(adjustedDueDate)} (для сохранения 3 дней запаса на монтаж).`,
        'shooting'
      );
    } else {
      addBotLog(
        'Съемка/Материалы',
        `Зафиксирован слот съемки к #${taskId} на ${date}. В календаре активирована метка «Съемка».`,
        'shooting'
      );
    }
  };

  const addFootagePool = (taskId: string, filesCount: number, poolNote?: string) => {
    updateTaskInState(taskId, t => {
      const poolNumber = (t.pools.length + 1);
      const poolName = poolNumber === 1 
        ? `Пул 1: Исходники (${filesCount} файлов)`
        : `Пул ${poolNumber}: Доп. дубли (${filesCount} файлов)`;
        
      const newPool: MaterialPool = {
        id: `pool-${taskId}-${poolNumber}-${Date.now()}`,
        poolNumber,
        name: poolName,
        filesCount,
        telegramChatLink: `https://t.me/c/2145893201/${1200 + poolNumber * 10}`,
        uploadedAt: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
        note: poolNote || (poolNumber === 1 ? 'Основной дубль' : 'Дополнительные дубли и b-roll'),
      };

      const totalFiles = t.materialsTotalCount + filesCount;
      return {
        ...t,
        materialsTotalCount: totalFiles,
        pools: [...t.pools, newPool],
        shootingStatus: 'green', // materials loaded!
        editingStatus: 'yellow', // In editing process!
        assignedEditor: t.type === 'reels' ? (t.assignedEditor || 'Арсений') : undefined,
        assignedDesigner: t.type !== 'reels' ? (t.assignedDesigner || 'Марина') : undefined,
        updatedAt: new Date().toISOString(),
      };
    });
    
    const targetTask = tasks.find(t => t.id === taskId);
    const recipient = targetTask?.type === 'reels' ? 'Монтажёр (Арсений)' : 'Дизайнер (Марина)';
    addBotLog(
      'Съемка/Материалы',
      `Уведомление для ${recipient}: К задаче #${taskId} «${targetTask?.title || ''}» загружены исходники (${filesCount} файлов). Материалы переданы в работу!`,
      'materials'
    );
  };

  const appendIdeaSupplement = (taskId: string, data: { type: 'voice' | 'video' | 'text' | 'image'; note: string; title?: string }) => {
    const supplementTypeLabel = {
      voice: 'Голосовая заметка',
      video: 'Видео-референс',
      text: 'Заметка/мысль',
      image: 'Скриншот/референс',
    }[data.type];

    const newSupplement: { id: string; type: 'voice' | 'video' | 'text' | 'image'; title: string; telegramLink: string; addedAt: string; note: string } = {
      id: `supp-${taskId}-${Date.now()}`,
      type: data.type,
      title: data.title || `${supplementTypeLabel}: ${data.note.slice(0, 28)}...`,
      telegramLink: `https://t.me/c/2145893201/${1150 + Math.floor(Math.random() * 50)}`,
      addedAt: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
      note: data.note,
    };

    updateTaskInState(taskId, t => ({
      ...t,
      hasVoiceNotes: data.type === 'voice' ? true : t.hasVoiceNotes,
      hasMediaReferences: (data.type === 'video' || data.type === 'image') ? true : t.hasMediaReferences,
      supplements: [...(t.supplements || []), newSupplement],
      updatedAt: new Date().toISOString(),
    }));

    const targetTask = tasks.find(t => t.id === taskId);
    const recipient = targetTask?.type === 'reels' ? 'Монтажёр (Арсений)' : 'Дизайнер (Марина)';
    addBotLog(
      'Съемка/Материалы',
      `Уведомление для ${recipient}: К задаче #${taskId} «${targetTask?.title || ''}» досланы материалы (${supplementTypeLabel}): «${data.note}». Синхронизировано с карточкой!`,
      'materials'
    );
  };

  const submitRender = (taskId: string, renderUrl: string, coverUrl?: string) => {
    updateTaskInState(taskId, t => ({
      ...t,
      renderUrl,
      coverUrl: coverUrl || 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=600&auto=format&fit=crop&q=80',
      renderDeliveredAt: new Date().toISOString(),
      editingStatus: 'green', // render ready!
      renderApprovedByExpert: false,
      renderNeedsRevision: false,
      updatedAt: new Date().toISOString(),
    }));
    
    addBotLog(
      'Монтаж/Рилсы',
      `Монтажер сдал готовый ролик #${taskId}! Эксперту отправлен запрос на проверку: [Одобрено] / [Нужны правки].`,
      'render'
    );
  };

  const attachRenderFromChat = (taskId: string, renderUrl: string, coverUrl?: string, note?: string) => {
    updateTaskInState(taskId, t => ({
      ...t,
      renderUrl: renderUrl || 'https://assets.mixkit.co/videos/preview/mixkit-girl-talking-to-camera-in-a-studio-setting-42289-large.mp4',
      coverUrl: coverUrl || 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=600&auto=format&fit=crop&q=80',
      renderDeliveredAt: new Date().toISOString(),
      editingStatus: 'green', // render ready!
      renderApprovedByExpert: false,
      renderNeedsRevision: false,
      updatedAt: new Date().toISOString(),
    }));

    addBotLog(
      'Монтаж/Рилсы',
      `Запущена команда /render к #${taskId}! Монтажер прикрепил рендер ${note ? `(«${note}»)` : ''}. Эксперту направлен интерактивный пост: [Одобрено] [Нужны правки].`,
      'render'
    );
  };

  const reviewRender = (taskId: string, approved: boolean, revisionNotes?: string) => {
    updateTaskInState(taskId, t => ({
      ...t,
      renderApprovedByExpert: approved,
      renderNeedsRevision: !approved,
      revisionNotes: approved ? undefined : revisionNotes,
      editingStatus: approved ? 'green' : 'yellow',
      updatedAt: new Date().toISOString(),
    }));
    
    if (approved) {
      addBotLog(
        'Монтаж/Рилсы',
        `Эксперт ОДОБРИЛ ролик #${taskId}! Продюсеру @Кирилл направлен выбор плейсмента: [В пробные] / [В основную ленту].`,
        'approval'
      );
    } else {
      addBotLog(
        'Монтаж/Рилсы',
        `К ролику #${taskId} отправлены правки: «${revisionNotes || 'Переделать хук'}».`,
        'revision'
      );
    }
  };

  const setPlacement = (taskId: string, placement: PlacementType) => {
    const target = tasks.find(t => t.id === taskId);
    if (!target || target.kind === 'non_content' || (target.type !== 'reels' && target.type !== 'carousel' && target.type !== 'stories')) {
      addBotLog('Публикация', `Отклонено: Задачи из категории «Не контент» не передаются на публикацию. На публикацию передаются только рилсы, карусели и сторис.`);
      return;
    }
    updateTaskInState(taskId, t => {
      const isTrial = placement === 'trial';
      const now = new Date();
      const expires = new Date(now.getTime() + 48 * 60 * 60 * 1000);
      
      return {
        ...t,
        placement,
        trialPublishedAt: isTrial ? now.toISOString() : undefined,
        trialExpiresAt: isTrial ? expires.toISOString() : undefined,
        updatedAt: new Date().toISOString(),
      };
    });
    
    addBotLog(
      'Публикация',
      `Плейсмент для #${taskId} установлен: ${placement === 'trial' ? '«В пробные» (тест 48ч)' : '«В основную ленту»'}.`,
      'placement'
    );
  };

  const markTrialPublished = (taskId: string) => {
    const target = tasks.find(t => t.id === taskId);
    if (!target || target.kind === 'non_content' || (target.type !== 'reels' && target.type !== 'carousel' && target.type !== 'stories')) {
      return;
    }
    const now = new Date();
    const expires = new Date(now.getTime() + 48 * 60 * 60 * 1000);
    updateTaskInState(taskId, t => ({
      ...t,
      placement: 'trial',
      trialPublishedAt: now.toISOString(),
      trialExpiresAt: expires.toISOString(),
      updatedAt: new Date().toISOString(),
    }));
    addBotLog('Публикация', `Ролик #${taskId} опубликован в пробных! Запущен таймер 48 часов теста.`, 'trial_started');
  };

  const promoteTrialToMain = (taskId: string) => {
    const target = tasks.find(t => t.id === taskId);
    if (!target || target.kind === 'non_content' || (target.type !== 'reels' && target.type !== 'carousel' && target.type !== 'stories')) {
      return;
    }
    updateTaskInState(taskId, t => ({
      ...t,
      placement: 'main_feed',
      updatedAt: new Date().toISOString(),
    }));
    addBotLog('Публикация', `48-часовой тест #${taskId} завершен успешно! Ролик перенесен в основную ленту профиля.`, 'promoted');
  };

  const attachCover = (taskId: string, coverUrl: string, note?: string) => {
    updateTaskInState(taskId, t => ({
      ...t,
      coverUrl,
      coverCommandSent: true,
      coverNote: note,
      updatedAt: new Date().toISOString(),
    }));

    addBotLog(
      'Монтаж/Рилсы',
      `Команда /cover выполнена для ролика #${taskId}! Обложка загружена и привязана к проекту.${note ? ` Примечание: «${note}».` : ''}`,
      'cover'
    );
  };

  const setPublicationSchedule = (taskId: string, trialDate?: string, publishDate?: string) => {
    const target = tasks.find(t => t.id === taskId);
    if (!target || target.kind === 'non_content' || (target.type !== 'reels' && target.type !== 'carousel' && target.type !== 'stories')) {
      return;
    }
    updateTaskInState(taskId, t => ({
      ...t,
      trialStartDate: trialDate,
      finalPublishDate: publishDate,
      updatedAt: new Date().toISOString(),
    }));

    addBotLog(
      'Публикация',
      `Для #${taskId} настроен график релизов: Пробный режим: ${trialDate || 'не задан'} | Основная публикация: ${publishDate || 'не задана'}.`,
      'publication_scheduled'
    );
  };

  const rejectTask = (taskId: string, stage: 'idea' | 'script' | 'video' | 'editing' | 'delivered', reason: string) => {
    const stageLabels: Record<string, string> = {
      idea: 'Идея',
      script: 'Сценарий',
      video: 'Съемка / Видео',
      editing: 'Монтаж / Разработка',
      delivered: 'Сдан / Финал'
    };

    updateTaskInState(taskId, t => ({
      ...t,
      rejected: true,
      rejectedStage: stage,
      rejectedReason: reason,
      rejectedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));

    addBotLog(
      'Конвейер',
      `Задача #${taskId} ЗАБРАКОВАНА на этапе «${stageLabels[stage] || stage}»! Причина: «${reason}». Отправлено в отбракованные.`,
      'task_rejected'
    );
  };

  const restoreTask = (taskId: string) => {
    updateTaskInState(taskId, t => ({
      ...t,
      rejected: false,
      rejectedReason: undefined,
      rejectedStage: undefined,
      rejectedAt: undefined,
      updatedAt: new Date().toISOString()
    }));

    addBotLog(
      'Конвейер',
      `Задача #${taskId} восстановлена из брака обратно в рабочий конвейер.`,
      'task_restored'
    );
  };

  const moveTaskToStage = (taskId: string, targetStage: 'idea' | 'script' | 'shooting' | 'editing' | 'delivered') => {
    const targetTask = tasks.find(t => t.id === taskId);
    if (!targetTask || targetTask.kind === 'non_content' || (targetTask.type !== 'reels' && targetTask.type !== 'carousel' && targetTask.type !== 'stories')) {
      return;
    }
    const stageNames: Record<string, string> = {
      idea: 'Идея',
      script: 'Сценарий',
      shooting: 'На съёмке',
      editing: 'В разработке',
      delivered: 'Сдан'
    };

    updateTaskInState(taskId, t => {
      if (targetStage === 'delivered') {
        return {
          ...t,
          scriptStatus: 'green',
          shootingStatus: 'green',
          editingStatus: 'green',
          renderApprovedByExpert: true,
          renderDeliveredAt: t.renderDeliveredAt || new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
      } else if (targetStage === 'editing') {
        return {
          ...t,
          scriptStatus: 'green',
          shootingStatus: 'green',
          editingStatus: 'yellow',
          updatedAt: new Date().toISOString()
        };
      } else if (targetStage === 'shooting') {
        if (!t.scriptText || t.scriptText.trim().length === 0) {
          alert(`Назначить съёмку для задачи #${taskId} можно только после того, как сценарий будет написан.`);
          return t;
        }
        return {
          ...t,
          scriptStatus: 'green',
          shootingStatus: 'yellow',
          editingStatus: 'gray',
          updatedAt: new Date().toISOString()
        };
      } else if (targetStage === 'script') {
        return {
          ...t,
          scriptStatus: 'yellow',
          shootingStatus: 'gray',
          editingStatus: 'gray',
          updatedAt: new Date().toISOString()
        };
      } else {
        return {
          ...t,
          scriptStatus: 'gray',
          shootingStatus: 'gray',
          editingStatus: 'gray',
          updatedAt: new Date().toISOString()
        };
      }
    });

    addBotLog(
      'Конвейер',
      `Карточка #${taskId} перенесена в колонку «${stageNames[targetStage]}».`,
      'stage_moved'
    );
  };

  const createCall = (data: { title: string; date: string; time: string; durationMinutes: number; participants: string[]; link?: string }) => {
    const finalLink = (data.link && data.link.trim() && !data.link.includes('production-hub'))
      ? data.link.trim()
      : generateWorkingCallLink('jitsi', data.title);

    const newCall: CallEvent = {
      id: `call-${Date.now()}`,
      title: data.title,
      date: data.date,
      time: data.time,
      durationMinutes: data.durationMinutes,
      participants: data.participants,
      link: finalLink,
      expertId: currentExpertId,
      projectId: currentProjectId
    };

    setCalls(prev => [...prev, newCall]);
    syncCallToFirestore(newCall);

    addBotLog(
      'Созвоны',
      `Назначен созвон: «${data.title}» (${data.date} в ${data.time}, ${data.durationMinutes} мин). Участники: ${data.participants.join(', ')}. Ссылка отправлена в чат!`,
      'call_created'
    );
  };

  const updateUserRole = (userId: string, newRole: UserRole) => {
    setChatUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
    const targetUser = chatUsers.find(u => u.id === userId);
    addBotLog(
      'Команда',
      `Пользователю ${targetUser?.telegramUsername || userId} присвоена роль: «${newRole}». Права доступа обновлены.`,
      'role_assigned'
    );
  };

  const addChatUser = (username: string, name: string, role: UserRole, customTitle?: string) => {
    const cleanUsername = username.startsWith('@') ? username : `@${username}`;
    const newUser: ChatUser = {
      id: `user-${Date.now()}`,
      telegramUsername: cleanUsername,
      name: name.trim() || cleanUsername,
      role,
      customTitle: customTitle || 'Участник супергруппы',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'
    };

    setChatUsers(prev => [...prev, newUser]);

    addBotLog(
      'Команда',
      `Добавлен участник из Telegram-чата: ${cleanUsername} (${name}) с ролью: «${role}».`,
      'user_added'
    );
  };

  const archiveTask = (taskId: string) => {
    updateTaskInState(taskId, t => ({
      ...t,
      isArchived: true,
      updatedAt: new Date().toISOString(),
    }));
    addBotLog('Архив', `Карточка #${taskId} перемещена в архив.`, 'archive');
  };

  const deleteTask = (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
    removeTaskFromFirestore(taskId);
    addBotLog('Задачи', `Задача #${taskId} полностью удалена из базы данных.`, 'task_deleted');
  };

  const updateTaskDetails = (taskId: string, updates: Partial<TaskCard>) => {
    updateTaskInState(taskId, t => {
      if (t.kind === 'non_content') {
        const { placement, trialStartDate, finalPublishDate, targetPublishDate, renderApprovedByExpert, ...rest } = updates;
        return {
          ...t,
          ...rest,
          placement: 'unassigned',
          editingStatus: 'gray',
          updatedAt: new Date().toISOString(),
        };
      }
      return {
        ...t,
        ...updates,
        updatedAt: new Date().toISOString(),
      };
    });
  };

  const rescheduleCall = (callId: string, newDate: string, newTime: string) => {
    let updatedCall: CallEvent | null = null;
    setCalls(prev => prev.map(c => {
      if (c.id === callId) {
        updatedCall = {
          ...c,
          date: newDate,
          time: newTime,
        };
        return updatedCall;
      }
      return c;
    }));
    if (updatedCall) {
      syncCallToFirestore(updatedCall);
    }
    addBotLog(
      'Созвоны',
      `Время созвона изменено на ${newDate} в ${newTime}. Уведомление со ссылкой отправлено в чат участникам.`,
      'call_rescheduled'
    );
  };

  const deleteCall = (callId: string) => {
    const targetCall = calls.find(c => c.id === callId);
    setCalls(prev => prev.filter(c => c.id !== callId));
    removeCallFromFirestore(callId);
    addBotLog(
      'Созвоны',
      `Созвон «${targetCall?.title || 'Без названия'}» удален из расписания. Уведомление об отмене отправлено в чат участникам.`,
      'call_deleted'
    );
  };

  const clearAllTasks = async () => {
    syncService.sendClearAllTasks();
    localStorage.setItem(STORAGE_KEY_DB_CLEARED, 'true');
    localStorage.removeItem(STORAGE_KEY_TASKS);
    setTasks([]);
    try {
      const snap = await getDocs(collection(db, 'tasks'));
      const batch = writeBatch(db);
      snap.forEach(d => batch.delete(d.ref));
      batch.set(doc(db, 'system', 'state'), { isCleared: true, clearedAt: new Date().toISOString() });
      await batch.commit();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'tasks');
    }
    addBotLog(
      'Админ-панель',
      'Произведен полный сброс всех задач и банка идей! Все карточки очищены из базы данных.',
      'system_reset'
    );
  };

  const resetAllData = async () => {
    syncService.sendResetAllData(INITIAL_TASKS, INITIAL_CALLS);
    localStorage.removeItem(STORAGE_KEY_DB_CLEARED);
    localStorage.removeItem(STORAGE_KEY_TASKS);
    localStorage.removeItem(STORAGE_KEY_CALLS);
    setTasks(INITIAL_TASKS);
    setCalls(INITIAL_CALLS);
    try {
      const batch = writeBatch(db);
      const snapTasks = await getDocs(collection(db, 'tasks'));
      snapTasks.forEach(d => batch.delete(d.ref));
      const snapCalls = await getDocs(collection(db, 'calls'));
      snapCalls.forEach(d => batch.delete(d.ref));
      for (const t of INITIAL_TASKS) {
        batch.set(doc(db, 'tasks', t.id), cleanFirestoreData(t));
      }
      for (const c of INITIAL_CALLS) {
        batch.set(doc(db, 'calls', c.id), cleanFirestoreData(c));
      }
      batch.set(doc(db, 'system', 'state'), { isCleared: false, restoredAt: new Date().toISOString() });
      await batch.commit();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'system');
    }
    addBotLog(
      'Админ-панель',
      'Исходные демонстрационные данные успешно загружены в базу данных Firestore.',
      'system_reset'
    );
  };

  return (
    <ProductionContext.Provider
      value={{
        currentRole,
        setCurrentRole,
        currentExpertId,
        setCurrentExpertId,
        experts: INITIAL_EXPERTS,
        impersonatedRole,
        setImpersonatedRole,
        activeRole,
        projectName,
        setProjectName,
        chatTitle,
        setChatTitle,
        telegramHandle,
        setTelegramHandle,
        isDevModeActive,
        setIsDevModeActive,
        exitDevMode,
        norms,
        updateNorms,
        weeklySchedule,
        updateWeeklySchedule,
        applyWeeklyPlanToSchedule,
        isWeeklyPlannerOpen,
        setIsWeeklyPlannerOpen,
        isWeekPlanned,
        setIsWeekPlanned,
        isSettingsOpen,
        setIsSettingsOpen,
        settingsTab,
        openSettings,
        chatUsers,
        updateUserRole,
        addChatUser,
        tasks,
        calls,
        stats,
        selectedTaskId,
        setSelectedTaskId,
        editingScriptTaskId,
        setEditingScriptTaskId,
        createIdea,
        createTask,
        addSubtask,
        updateSubtaskStatus,
        updateMultipleSubtasksStatus,
        deleteSubtask,
        toggleNonContentTaskStatus,
        saveScriptDraft,
        approveScript,
        scheduleShooting,
        addFootagePool,
        appendIdeaSupplement,
        submitRender,
        attachRenderFromChat,
        attachCover,
        reviewRender,
        setPlacement,
        setPublicationSchedule,
        rejectTask,
        restoreTask,
        moveTaskToStage,
        markTrialPublished,
        promoteTrialToMain,
        archiveTask,
        deleteTask,
        updateTaskDetails,
        createCall,
        rescheduleCall,
        deleteCall,
        clearAllTasks,
        resetAllData,
        isCloudSyncing,
        syncStatus,
        projects,
        currentProjectId,
        setCurrentProjectId,
        currentProject,
        completeProjectSetup,
        updateProjectMembers,
        currentUser,
        scaffoldProjectTopics,
        botLogs,
        addBotLog,
      }}
    >
      {children}
    </ProductionContext.Provider>
  );
};

export const useProduction = () => {
  const context = useContext(ProductionContext);
  if (!context) {
    throw new Error('useProduction must be used within ProductionProvider');
  }
  return context;
};

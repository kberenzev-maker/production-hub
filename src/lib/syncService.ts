import { TaskCard, CallEvent, Project } from '../types';

export type SyncConnectionStatus = 'connected' | 'connecting' | 'offline';

interface SyncCallbacks {
  onStateSnapshot?: (data: { tasks: TaskCard[]; calls: CallEvent[]; projects?: Project[] }) => void;
  onTaskUpsert?: (task: TaskCard) => void;
  onTaskDelete?: (taskId: string) => void;
  onCallUpsert?: (call: CallEvent) => void;
  onCallDelete?: (callId: string) => void;
  onProjectUpsert?: (project: Project) => void;
  onTasksCleared?: () => void;
  onStateReset?: (data: { tasks: TaskCard[]; calls: CallEvent[] }) => void;
  onStatusChange?: (status: SyncConnectionStatus, clientCount: number) => void;
}

class RealtimeSyncService {
  private ws: WebSocket | null = null;
  private status: SyncConnectionStatus = 'offline';
  private clientCount: number = 1;
  private callbacks: SyncCallbacks = {};
  private clientId: string = `client-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  private reconnectTimer: any = null;
  private isExplicitDisconnect: boolean = false;

  constructor() {
    // Client id is unique per tab/window
  }

  public init(callbacks: SyncCallbacks) {
    this.callbacks = callbacks;
    // Fast initial HTTP snapshot warmup
    if (typeof window !== 'undefined') {
      fetch('/api/sync/state')
        .then(res => res.json())
        .then(data => {
          if (data && (Array.isArray(data.tasks) || Array.isArray(data.calls))) {
            this.callbacks.onInitialSnapshot?.(data);
          }
        })
        .catch(() => {});
    }
    this.connect();
  }

  public getStatus(): SyncConnectionStatus {
    return this.status;
  }

  public getClientCount(): number {
    return this.clientCount;
  }

  private setStatus(newStatus: SyncConnectionStatus, count?: number) {
    this.status = newStatus;
    if (count !== undefined) {
      this.clientCount = count;
    }
    this.callbacks.onStatusChange?.(this.status, this.clientCount);
  }

  public connect() {
    if (typeof window === 'undefined') return;
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    clearTimeout(this.reconnectTimer);
    this.setStatus('connecting');

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws/sync`;

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.setStatus('connected');
        this.send({ type: 'GET_STATE' });
      };

      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          this.handleMessage(msg);
        } catch (e) {
          console.error('[SyncService] Failed to parse message:', e);
        }
      };

      this.ws.onclose = () => {
        this.setStatus('offline', 1);
        this.ws = null;
        if (!this.isExplicitDisconnect) {
          // Reconnect after 3 seconds
          this.reconnectTimer = setTimeout(() => {
            this.connect();
          }, 3000);
        }
      };

      this.ws.onerror = () => {
        // Will trigger onclose
      };
    } catch (e) {
      this.setStatus('offline');
      this.reconnectTimer = setTimeout(() => {
        this.connect();
      }, 5000);
    }
  }

  private handleMessage(msg: any) {
    if (!msg || !msg.type) return;

    if (msg.clientCount !== undefined) {
      this.clientCount = msg.clientCount;
      this.callbacks.onStatusChange?.(this.status, this.clientCount);
    }

    // Ignore messages originating from this exact client
    if (msg.clientId && msg.clientId === this.clientId) {
      return;
    }

    switch (msg.type) {
      case 'PRESENCE': {
        this.clientCount = msg.clientCount || 1;
        this.callbacks.onStatusChange?.(this.status, this.clientCount);
        break;
      }

      case 'STATE_SNAPSHOT': {
        if (msg.data) {
          this.callbacks.onStateSnapshot?.({
            tasks: msg.data.tasks || [],
            calls: msg.data.calls || [],
            projects: msg.data.projects || []
          });
        }
        break;
      }

      case 'TASK_UPSERTED': {
        if (msg.task) {
          this.callbacks.onTaskUpsert?.(msg.task);
        }
        break;
      }

      case 'TASK_DELETED': {
        if (msg.taskId) {
          this.callbacks.onTaskDelete?.(msg.taskId);
        }
        break;
      }

      case 'CALL_UPSERTED': {
        if (msg.call) {
          this.callbacks.onCallUpsert?.(msg.call);
        }
        break;
      }

      case 'CALL_DELETED': {
        if (msg.callId) {
          this.callbacks.onCallDelete?.(msg.callId);
        }
        break;
      }

      case 'PROJECT_UPSERTED': {
        if (msg.project) {
          this.callbacks.onProjectUpsert?.(msg.project);
        }
        break;
      }

      case 'TASKS_CLEARED': {
        this.callbacks.onTasksCleared?.();
        break;
      }

      case 'STATE_RESET': {
        if (msg.data) {
          this.callbacks.onStateReset?.({
            tasks: msg.data.tasks || [],
            calls: msg.data.calls || []
          });
        }
        break;
      }
    }
  }

  private send(data: any) {
    const payload = { ...data, clientId: this.clientId };
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload));
    } else {
      // Fallback via HTTP POST
      try {
        fetch('/api/sync/message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }).catch(() => {});
      } catch (e) {}
    }
  }

  // Public Actions
  public sendTaskUpsert(task: TaskCard) {
    this.send({ type: 'TASK_UPSERT', task });
  }

  public sendTaskDelete(taskId: string) {
    this.send({ type: 'TASK_DELETE', taskId });
  }

  public sendCallUpsert(call: CallEvent) {
    this.send({ type: 'CALL_UPSERT', call });
  }

  public sendCallDelete(callId: string) {
    this.send({ type: 'CALL_DELETE', callId });
  }

  public sendScaffoldProject(chatId: number, chatTitle: string) {
    this.send({ type: 'SCAFFOLD_PROJECT', chatId, chatTitle });
  }

  public sendProjectUpsert(project: Project) {
    this.send({ type: 'UPDATE_PROJECT', project });
  }

  public sendClearAllTasks() {
    this.send({ type: 'CLEAR_ALL_TASKS' });
  }

  public sendResetAllData(initialTasks: TaskCard[], initialCalls: CallEvent[]) {
    this.send({ type: 'RESET_ALL_DATA', initialTasks, initialCalls });
  }

  public sendInitialSeedIfEmpty(tasks: TaskCard[], calls: CallEvent[]) {
    this.send({ type: 'INITIAL_SEED_IF_EMPTY', tasks, calls });
  }
}

export const syncService = new RealtimeSyncService();

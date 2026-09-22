import express from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { ProductionTelegramBot } from './telegramBot.ts';
import { Project } from '../src/types.ts';

// Load .env
dotenv.config();

const PORT = Number(process.env.PORT || 3000);
const DB_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'shared-database.json');
const DIST_DIR = path.resolve(process.cwd(), 'dist');

interface SyncDatabase {
  tasks: any[];
  calls: any[];
  projects: Project[];
  botToken?: string;
  version: number;
  updatedAt: string;
}

const DEFAULT_PROJECTS: Project[] = [
  {
    id: 'proj-vera',
    chatId: -1002145893201,
    title: 'Эксперт Вера | Запуск Октябрь',
    topics: {
      ideas: 1148,
      scripts: 1149,
      shooting: 1150,
      materials: 1151,
      reels: 1152,
      carousels: 1153,
      stories: 1154,
      publications: 1155,
      calls: 1156
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'proj-artem',
    chatId: -1002145893202,
    title: 'Артём | Инвестиции',
    topics: {
      ideas: 201,
      scripts: 202,
      shooting: 203,
      materials: 204,
      reels: 205,
      carousels: 206,
      stories: 207,
      publications: 208,
      calls: 209
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

function loadDatabase(): SyncDatabase {
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.tasks)) {
        if (!parsed.projects || !Array.isArray(parsed.projects) || parsed.projects.length === 0) {
          parsed.projects = DEFAULT_PROJECTS;
        }
        return parsed;
      }
    }
  } catch (err) {
    console.error('[StandaloneServer] Error loading database:', err);
  }

  const initialData: SyncDatabase = {
    tasks: [],
    calls: [],
    projects: DEFAULT_PROJECTS,
    version: 1,
    updatedAt: new Date().toISOString()
  };
  saveDatabase(initialData);
  return initialData;
}

function saveDatabase(db: SyncDatabase) {
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    db.updatedAt = new Date().toISOString();
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('[StandaloneServer] Error saving database:', err);
  }
}

const app = express();
app.use((req, res, next) => {
  res.setHeader('ngrok-skip-browser-warning', 'true');
  next();
});
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws/sync' });
const clients = new Set<WebSocket>();

const broadcast = (data: any, excludeWs?: WebSocket) => {
  const message = JSON.stringify(data);
  for (const client of clients) {
    if (client !== excludeWs && client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  }
};

const broadcastPresence = () => {
  broadcast({
    type: 'PRESENCE',
    clientCount: clients.size,
    timestamp: new Date().toISOString()
  });
};

const token = process.env.TELEGRAM_BOT_TOKEN || '';
const appUrl = process.env.APP_URL || `http://localhost:${PORT}`;
const geminiApiKey = process.env.GEMINI_API_KEY || '';

const bot = new ProductionTelegramBot({
  token,
  appUrl,
  geminiApiKey
}, {
  onTaskCreated: (task) => {
    const activeDb = loadDatabase();
    activeDb.tasks.unshift(task);
    saveDatabase(activeDb);
    broadcast({ type: 'TASK_UPSERTED', task });
  },
  onCallUpdated: (call) => {
    const activeDb = loadDatabase();
    const idx = activeDb.calls.findIndex((c: any) => c.id === call.id);
    if (idx >= 0) activeDb.calls[idx] = call;
    saveDatabase(activeDb);
    broadcast({ type: 'CALL_UPSERTED', call });
  },
  onProjectScaffolded: (chatId, chatTitle, topics) => {
    const activeDb = loadDatabase();
    let proj = activeDb.projects.find((p: any) => p.chatId === chatId);
    if (proj) {
      proj.topics = topics;
      proj.title = chatTitle;
      proj.updatedAt = new Date().toISOString();
    } else {
      proj = {
        id: `proj-${Date.now()}`,
        chatId,
        title: chatTitle,
        topics,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      activeDb.projects.push(proj);
    }
    saveDatabase(activeDb);
    broadcast({ type: 'PROJECT_UPSERTED', project: proj });
  }
});

// Call Reminder Interval
setInterval(() => {
  try {
    const activeDb = loadDatabase();
    bot.checkCallReminders(activeDb.calls);
  } catch (e) {
    console.warn('[StandaloneServer] Ошибка проверки напоминаний:', e);
  }
}, 30000);

// API Endpoints
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    version: '1.0.0',
    mode: process.env.NODE_ENV || 'production',
    clientsCount: clients.size,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/sync/state', (req, res) => {
  res.json(loadDatabase());
});

app.post('/api/bot/scaffold', async (req, res) => {
  try {
    const { chatId = -1002145893201, chatTitle = 'Новый проект' } = req.body || {};
    const topics = await bot.scaffoldChatTopics(Number(chatId), String(chatTitle));
    res.json({ success: true, topics });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Serve frontend static files from dist
if (fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR));
  app.get('*', (req, res) => {
    res.sendFile(path.join(DIST_DIR, 'index.html'));
  });
} else {
  console.warn('⚠️ [StandaloneServer] Папка dist не найдена. Запустите: bun run build');
}

// WebSocket Connection Handlers
wss.on('connection', (ws) => {
  clients.add(ws);
  const currentDb = loadDatabase();

  ws.send(JSON.stringify({
    type: 'STATE_SNAPSHOT',
    data: currentDb,
    clientCount: clients.size
  }));

  broadcastPresence();

  ws.on('message', async (raw) => {
    try {
      const msg = JSON.parse(raw.toString());
      const activeDb = loadDatabase();

      switch (msg.type) {
        case 'GET_STATE': {
          ws.send(JSON.stringify({
            type: 'STATE_SNAPSHOT',
            data: activeDb,
            clientCount: clients.size
          }));
          break;
        }

        case 'TASK_UPSERT': {
          const incomingTask = msg.task;
          if (!incomingTask || !incomingTask.id) return;
          const idx = activeDb.tasks.findIndex(t => t.id === incomingTask.id);
          if (idx >= 0) {
            activeDb.tasks[idx] = incomingTask;
          } else {
            activeDb.tasks.unshift(incomingTask);
          }
          saveDatabase(activeDb);
          broadcast({
            type: 'TASK_UPSERTED',
            task: incomingTask,
            clientId: msg.clientId
          }, ws);
          break;
        }

        case 'TASK_DELETE': {
          const taskId = msg.taskId;
          if (!taskId) return;
          activeDb.tasks = activeDb.tasks.filter(t => t.id !== taskId);
          saveDatabase(activeDb);
          broadcast({
            type: 'TASK_DELETED',
            taskId,
            clientId: msg.clientId
          }, ws);
          break;
        }

        case 'CALL_UPSERT': {
          const incomingCall = msg.call;
          if (!incomingCall || !incomingCall.id) return;
          const idx = activeDb.calls.findIndex(c => c.id === incomingCall.id);
          if (idx >= 0) {
            activeDb.calls[idx] = incomingCall;
          } else {
            activeDb.calls.unshift(incomingCall);
          }
          saveDatabase(activeDb);
          broadcast({
            type: 'CALL_UPSERTED',
            call: incomingCall,
            clientId: msg.clientId
          }, ws);
          break;
        }

        case 'CALL_DELETE': {
          const callId = msg.callId;
          if (!callId) return;
          activeDb.calls = activeDb.calls.filter(c => c.id !== callId);
          saveDatabase(activeDb);
          broadcast({
            type: 'CALL_DELETED',
            callId,
            clientId: msg.clientId
          }, ws);
          break;
        }

        case 'SCAFFOLD_PROJECT': {
          const chatId = msg.chatId || -1002145893201;
          const chatTitle = msg.chatTitle || 'Новый проект';
          await bot.scaffoldChatTopics(chatId, chatTitle);
          break;
        }

        case 'UPDATE_PROJECT': {
          const incomingProj = msg.project;
          if (!incomingProj || !incomingProj.id) return;
          const idx = activeDb.projects.findIndex(p => p.id === incomingProj.id);
          if (idx >= 0) {
            activeDb.projects[idx] = incomingProj;
          } else {
            activeDb.projects.push(incomingProj);
          }
          saveDatabase(activeDb);
          broadcast({
            type: 'PROJECT_UPSERTED',
            project: incomingProj,
            clientId: msg.clientId
          }, ws);
          break;
        }

        case 'CLEAR_ALL_TASKS': {
          activeDb.tasks = [];
          saveDatabase(activeDb);
          broadcast({
            type: 'TASKS_CLEARED',
            clientId: msg.clientId
          }, ws);
          break;
        }

        case 'RESET_ALL_DATA': {
          if (msg.initialTasks && msg.initialCalls) {
            activeDb.tasks = msg.initialTasks;
            activeDb.calls = msg.initialCalls;
            saveDatabase(activeDb);
            broadcast({
              type: 'STATE_RESET',
              data: activeDb,
              clientId: msg.clientId
            }, ws);
          }
          break;
        }
      }
    } catch (err) {
      console.error('[StandaloneServer] WebSocket message parse error:', err);
    }
  });

  ws.on('close', () => {
    clients.delete(ws);
    broadcastPresence();
  });

  ws.on('error', (err) => {
    console.warn('[StandaloneServer] WebSocket client error:', err.message);
    clients.delete(ws);
    broadcastPresence();
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🌐 [StandaloneServer] Production Hub запущен на порту ${PORT}`);
  console.log(`📱 [StandaloneServer] URL приложения: ${appUrl}`);
});

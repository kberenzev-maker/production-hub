import { Plugin } from 'vite';
import { WebSocketServer, WebSocket } from 'ws';
import fs from 'fs';
import path from 'path';
import { ProductionTelegramBot } from './telegramBot.ts';
import { Project } from '../src/types.ts';

interface SyncDatabase {
  tasks: any[];
  calls: any[];
  projects: Project[];
  botToken?: string;
  version: number;
  updatedAt: string;
}

const DB_DIR = path.resolve(import.meta.dirname, '../data');
const DB_FILE = path.join(DB_DIR, 'shared-database.json');

function getEnv(key: string, defaultValue: string = ''): string {
  if (process.env[key]) return process.env[key]!;
  try {
    const envPath = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf-8');
      for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
          const idx = trimmed.indexOf('=');
          const k = trimmed.slice(0, idx).trim();
          if (k === key) {
            let val = trimmed.slice(idx + 1).trim();
            if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
              val = val.slice(1, -1);
            }
            return val;
          }
        }
      }
    }
  } catch (e) {}
  return defaultValue;
}

function loadDatabase(): SyncDatabase {
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.tasks)) {
        if (!parsed.projects || !Array.isArray(parsed.projects)) {
          parsed.projects = [];
        }
        return parsed;
      }
    }
  } catch (err) {
    console.error('[RealtimeSync] Error loading database:', err);
  }

  const initialData: SyncDatabase = {
    tasks: [],
    calls: [],
    projects: [],
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
    console.error('[RealtimeSync] Error saving database:', err);
  }
}

export function realtimeSyncPlugin(): Plugin {
  let wss: WebSocketServer | null = null;
  const clients = new Set<WebSocket>();

  return {
    name: 'realtime-sync-plugin',
    configureServer(server) {
      if (!server.httpServer) return;

      const db = loadDatabase();

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

      // Initialize Telegram Bot
      const bot = new ProductionTelegramBot({
        token: getEnv('TELEGRAM_BOT_TOKEN') || db.botToken || '',
        appUrl: getEnv('APP_URL', 'http://localhost:3000'),
        geminiApiKey: getEnv('GEMINI_API_KEY')
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

      // Background Call Reminder interval (every 30 seconds)
      setInterval(() => {
        try {
          const activeDb = loadDatabase();
          bot.checkCallReminders(activeDb.calls);
        } catch (e) {
          console.warn('[RealtimeSync] Ошибка проверки напоминаний:', e);
        }
      }, 30000);

      // REST fallback endpoints & ngrok warning bypass
      server.middlewares.use((req, res, next) => {
        res.setHeader('ngrok-skip-browser-warning', 'true');
        if (req.url === '/api/sync/state' && req.method === 'GET') {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(loadDatabase()));
          return;
        }
        if (req.url === '/api/bot/scaffold' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => body += chunk);
          req.on('end', async () => {
            try {
              const parsed = JSON.parse(body || '{}');
              const chatId = parsed.chatId || -1002145893201;
              const chatTitle = parsed.chatTitle || 'Новый проект';
              const topics = await bot.scaffoldChatTopics(chatId, chatTitle);
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, topics }));
            } catch (err: any) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: err.message }));
            }
          });
          return;
        }
        next();
      });

      // WebSocket Server
      wss = new WebSocketServer({ 
        noServer: true
      });

      server.httpServer.on('upgrade', (request, socket, head) => {
        const url = request.url || '';
        if (url.startsWith('/ws/sync')) {
          wss?.handleUpgrade(request, socket, head, (ws) => {
            wss?.emit('connection', ws, request);
          });
        }
      });

      wss.on('connection', (ws) => {
        clients.add(ws);
        const currentDb = loadDatabase();

        // Send full state to newly connected client
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

              case 'INITIAL_SEED_IF_EMPTY': {
                if (activeDb.tasks.length === 0 && Array.isArray(msg.tasks) && msg.tasks.length > 0) {
                  activeDb.tasks = msg.tasks;
                  if (Array.isArray(msg.calls)) {
                    activeDb.calls = msg.calls;
                  }
                  saveDatabase(activeDb);
                  broadcast({
                    type: 'STATE_SNAPSHOT',
                    data: activeDb,
                    clientCount: clients.size
                  });
                }
                break;
              }
            }
          } catch (e) {
            console.error('[RealtimeSync] Failed to process message:', e);
          }
        });

        ws.on('close', () => {
          clients.delete(ws);
          broadcastPresence();
        });

        ws.on('error', (err) => {
          console.warn('[RealtimeSync] WebSocket error:', err.message);
          clients.delete(ws);
        });
      });

      console.log('⚡ [RealtimeSync] Realtime WebSocket Database & Telegram Bot Integration active');
    }
  };
}

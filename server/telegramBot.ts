import { Bot, InlineKeyboard } from 'grammy';
import path from 'path';
import fs from 'fs';
import { Project, ProjectTopics, TaskCard, CallEvent, ProjectMember, TEAM_ROLES, VoiceNoteItem } from '../src/types.ts';

export interface BotConfig {
  token: string;
  appUrl?: string;
  geminiApiKey?: string;
}

export const TOPIC_DEFINITIONS = [
  { key: 'ideas',        name: 'Идеи и подборки', iconCustomEmojiId: '5312016608254762256', iconColor: 0xFFD67E }, // ⚡️
  { key: 'scripts',      name: 'Сценарии',        iconCustomEmojiId: '5373251851074415873', iconColor: 0x6FB9F0 }, // 📝
  { key: 'shooting',     name: 'Съёмка',          iconCustomEmojiId: '5368653135101310687', iconColor: 0xFB6F5F }, // 🎬
  { key: 'materials',    name: 'Материалы',       iconCustomEmojiId: '5357315181649076022', iconColor: 0xCB86DB }, // 📁
  { key: 'reels',        name: 'Рилсы',           iconCustomEmojiId: '5409357944619802453', iconColor: 0x8EEE98 }, // 📱
  { key: 'carousels',    name: 'Карусели',       iconCustomEmojiId: '5310039132297242441', iconColor: 0xFF93B2 }, // 🎨
  { key: 'stories',      name: 'Сторис',          iconCustomEmojiId: '5357121491508928442', iconColor: 0xFFD67E }, // 👀
  { key: 'publications', name: 'Публикации',      iconCustomEmojiId: '5309984423003823246', iconColor: 0x6FB9F0 }, // 📣
  { key: 'calls',        name: 'Созвоны',         iconCustomEmojiId: '5377544228505134960', iconColor: 0x8EEE98 }, // 🎙
] as const;

const AUDIO_DIR = path.resolve(process.cwd(), 'data', 'audio');

// Download and convert voice file from Telegram to standard MP3 (or OGG fallback)
async function saveVoiceFile(token: string, fileId: string, uniqueId: string): Promise<string> {
  if (!fs.existsSync(AUDIO_DIR)) {
    fs.mkdirSync(AUDIO_DIR, { recursive: true });
  }

  const fileRes = await fetch(`https://api.telegram.org/bot${token}/getFile?file_id=${fileId}`);
  if (!fileRes.ok) throw new Error(`Telegram getFile failed: ${fileRes.status}`);
  const fileData: any = await fileRes.json();
  if (!fileData.ok || !fileData.result?.file_path) {
    throw new Error('Telegram getFile returned no file_path');
  }

  const downloadUrl = `https://api.telegram.org/file/bot${token}/${fileData.result.file_path}`;
  const audioRes = await fetch(downloadUrl);
  if (!audioRes.ok) throw new Error(`Download audio failed: ${audioRes.status}`);

  const arrayBuffer = await audioRes.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const rawFilename = `${uniqueId || Date.now()}.ogg`;
  const rawPath = path.join(AUDIO_DIR, rawFilename);
  await fs.promises.writeFile(rawPath, buffer);

  // Convert to mp3 using ffmpeg for 100% universal browser compatibility (iOS Safari, Mac, WebApp)
  const mp3Filename = `${uniqueId || Date.now()}.mp3`;
  const mp3Path = path.join(AUDIO_DIR, mp3Filename);
  try {
    const proc = Bun.spawn(['ffmpeg', '-i', rawPath, '-y', '-vn', '-ar', '44100', '-ac', '2', '-b:a', '128k', mp3Path], {
      stdout: 'ignore',
      stderr: 'ignore'
    });
    await proc.exited;
    if (fs.existsSync(mp3Path) && fs.statSync(mp3Path).size > 0) {
      return `/api/telegram/voice/${mp3Filename}`;
    }
  } catch (e) {
    console.warn('[TelegramBot] ffmpeg conversion warning, using ogg:', e);
  }

  return `/api/telegram/voice/${rawFilename}`;
}

interface IdeaSession {
  key: string;
  chatId: number;
  threadId?: number;
  userId: number;
  userName: string;
  texts: string[];
  links: string[];
  voices: VoiceNoteItem[];
  technicalMessageIds: number[];
  startedAt: number;
}

export class ProductionTelegramBot {
  private bot: Bot | null = null;
  private token: string = '';
  private appUrl: string = 'http://localhost:3000';
  private geminiApiKey: string = '';
  private ideaSessions = new Map<string, IdeaSession>(); // sessionKey -> session
  private isRunning: boolean = false;
  
  private onTaskCreated?: (task: TaskCard) => void;
  private onCallUpdated?: (call: CallEvent) => void;
  private onProjectScaffolded?: (chatId: number, chatTitle: string, topics: ProjectTopics, members?: ProjectMember[], isSetupComplete?: boolean) => void;
  private hasExistingTopics?: (chatId: number) => boolean;
  private onTaskApproved?: (taskId: string) => void;
  private getProjectTopics?: (chatId: number) => ProjectTopics | undefined;

  constructor(config: BotConfig, callbacks?: {
    onTaskCreated?: (task: TaskCard) => void;
    onCallUpdated?: (call: CallEvent) => void;
    onProjectScaffolded?: (chatId: number, chatTitle: string, topics: ProjectTopics, members?: ProjectMember[], isSetupComplete?: boolean) => void;
    hasExistingTopics?: (chatId: number) => boolean;
    onTaskApproved?: (taskId: string) => void;
    getProjectTopics?: (chatId: number) => ProjectTopics | undefined;
  }) {
    this.token = config.token;
    this.appUrl = config.appUrl || 'http://localhost:3000';
    this.geminiApiKey = config.geminiApiKey || '';
    this.onTaskCreated = callbacks?.onTaskCreated;
    this.onCallUpdated = callbacks?.onCallUpdated;
    this.onProjectScaffolded = callbacks?.onProjectScaffolded;
    this.hasExistingTopics = callbacks?.hasExistingTopics;
    this.onTaskApproved = callbacks?.onTaskApproved;
    this.getProjectTopics = callbacks?.getProjectTopics;

    // Stop any previous bot instance across Vite HMR reloads
    const prevInstance = (globalThis as any).__telegramBotInstance;
    if (prevInstance && typeof prevInstance.stop === 'function') {
      try {
        prevInstance.stop();
      } catch (e) {}
    }
    (globalThis as any).__telegramBotInstance = this;

    if (this.token && this.token.length > 10) {
      this.initBot();
    } else {
      console.log('ℹ️ [TelegramBot] Токен не указан. Бот работает в режиме эмуляции.');
    }
  }

  public updateToken(newToken: string) {
    if (newToken && newToken !== this.token) {
      this.token = newToken;
      this.stop();
      this.initBot();
    }
  }

  private initBot() {
    try {
      this.bot = new Bot(this.token);

      // HARD SECURITY LOCK: Permanently block deleteForumTopic API call
      // Никакой код, обновление или процесс никогда не сможет удалить топик через бота
      (this.bot.api as any).deleteForumTopic = async () => {
        throw new Error('⛔ [SECURITY] Удаление топиков перманентно запрещено на уровне архитектуры Production Hub.');
      };

      this.setupHandlers();
      this.start();
    } catch (err) {
      console.error('❌ [TelegramBot] Ошибка инициализации бота:', err);
    }
  }

  private getAppButton(text: string = '📱 Открыть Production Hub', isPrivate: boolean = false): InlineKeyboard {
    const kb = new InlineKeyboard();
    // Telegram Bot API restricts inline web_app buttons to 1-on-1 private chats only!
    // In groups and forum topics, inline buttons MUST use url().
    if (isPrivate && this.appUrl && this.appUrl.startsWith('https://')) {
      return kb.webApp(text, this.appUrl);
    }
    kb.url(text, this.appUrl || 'http://localhost:3000');
    // In group chats, add a second button allowing users to launch via the bot's private chat Menu Button:
    if (!isPrivate) {
      kb.row().url('🤖 Открыть через бота', 'https://t.me/content_production_hub_bot');
    }
    return kb;
  }

  private getIdeaSession(chatId: number, threadId: number | undefined, userId: number): IdeaSession | undefined {
    if (threadId) {
      const threadSession = this.ideaSessions.get(`${chatId}_${threadId}_${userId}`);
      if (threadSession) return threadSession;
    }
    return this.ideaSessions.get(`${chatId}_0_${userId}`) || this.ideaSessions.get(`${chatId}_${userId}`);
  }

  private isIdeasTopic(chatId: number, threadId?: number): boolean {
    if (chatId > 0) return true; // Private chats always allow idea recording
    if (!threadId) return false;
    const topics = this.getProjectTopics?.(chatId);
    if (topics?.ideas && topics.ideas === threadId) {
      return true;
    }
    return false;
  }

  private async startIdeaSession(
    chatId: number,
    threadId: number | undefined,
    userId: number,
    userName: string,
    initialVoice?: VoiceNoteItem,
    initialText?: string
  ): Promise<IdeaSession> {
    const sessionKey = `${chatId}_${threadId || 0}_${userId}`;
    const existing = this.ideaSessions.get(sessionKey);
    if (existing) {
      for (const msgId of existing.technicalMessageIds) {
        await this.bot?.api.deleteMessage(chatId, msgId).catch(() => {});
      }
    }

    const session: IdeaSession = {
      key: sessionKey,
      chatId,
      threadId,
      userId,
      userName,
      texts: initialText ? [initialText] : [],
      links: [],
      voices: initialVoice ? [initialVoice] : [],
      technicalMessageIds: [],
      startedAt: Date.now()
    };

    if (initialText) {
      const matches = initialText.match(/(https?:\/\/[^\s]+)/g);
      if (matches) session.links.push(...matches);
    }

    const kb = new InlineKeyboard()
      .text('✅ Завершить запись', `finish_idea_${sessionKey}`)
      .text('❌ Отмена', `cancel_idea_${sessionKey}`);

    const extra: any = {
      parse_mode: 'Markdown',
      reply_markup: kb
    };
    if (threadId) {
      extra.message_thread_id = threadId;
    }

    const promptText = 
      `🎙️ **Запись идеи началась!**\n\n` +
      `Отправляйте сюда всё подряд:\n` +
      `• 🗣 Голосовые сообщения\n` +
      `• 📝 Заметки и мысли текстом\n` +
      `• 🔗 Ссылки на референсы (Reels / Shorts)\n\n` +
      `_Бот тихо записывает и не спамит ответами._\n` +
      `Когда закончите — нажмите кнопку ниже или отправьте команду \`/done\`.`;

    try {
      const sent = await this.bot?.api.sendMessage(chatId, promptText, extra);
      if (sent) {
        session.technicalMessageIds.push(sent.message_id);
      }
    } catch (e) {
      console.warn('[TelegramBot] Ошибка отправки стартового сообщения записи идеи:', e);
    }

    this.ideaSessions.set(sessionKey, session);
    return session;
  }

  private async finishIdeaSession(sessionKey: string, triggerMessageId?: number) {
    const session = this.ideaSessions.get(sessionKey);
    if (!session) return;
    this.ideaSessions.delete(sessionKey);

    // 1. Auto-delete all technical messages sent by the bot during recording
    for (const msgId of session.technicalMessageIds) {
      try {
        await this.bot?.api.deleteMessage(session.chatId, msgId);
      } catch (e) {}
    }

    // 2. Delete user's command message (/done or /finish) to prevent chat clutter
    if (triggerMessageId) {
      try {
        await this.bot?.api.deleteMessage(session.chatId, triggerMessageId);
      } catch (e) {}
    }

    // 3. Check if session contains any content
    const hasContent = session.texts.length > 0 || session.voices.length > 0 || session.links.length > 0;
    if (!hasContent) {
      const extra: any = { parse_mode: 'Markdown' };
      if (session.threadId) extra.message_thread_id = session.threadId;
      try {
        const warn = await this.bot?.api.sendMessage(session.chatId, '⚠️ Запись отменена — ничего не было отправлено.', extra);
        if (warn) {
          setTimeout(() => {
            this.bot?.api.deleteMessage(session.chatId, warn.message_id).catch(() => {});
          }, 5000);
        }
      } catch (e) {}
      return;
    }

    // 4. Generate task ID and title
    const taskId = String(Math.floor(100 + Math.random() * 900));
    let mainTitle = 'Новая идея';
    if (session.texts[0]) {
      mainTitle = session.texts[0].trim();
      if (mainTitle.length > 80) mainTitle = mainTitle.slice(0, 80) + '...';
    } else if (session.voices.length > 0) {
      mainTitle = `Голосовая идея от ${session.userName}`;
    }

    const newTask: TaskCard = {
      id: taskId,
      title: mainTitle,
      type: 'reels',
      kind: 'content',
      expertId: `tg-${session.userId}`,
      expertName: session.userName,
      projectId: String(session.chatId),
      scriptStatus: 'gray',
      shootingStatus: 'gray',
      editingStatus: 'gray',
      materialsTotalCount: 0,
      pools: [],
      hasVoiceNotes: session.voices.length > 0,
      hasMediaReferences: session.links.length > 0,
      ideaDescription: session.texts.join('\n\n'),
      references: session.links.map((url, i) => ({
        id: `ref-${i}`,
        url,
        platform: url.includes('youtube') ? 'youtube' : url.includes('instagram') ? 'instagram' : 'other',
        title: `Референс #${i + 1}`
      })),
      voiceNotes: session.voices,
      placement: 'unassigned',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Callback to sync with backend database and broadcast WebSocket
    this.onTaskCreated?.(newTask);

    // 5. Send ONE clean notification into the topic with app link and script approval
    if (this.bot && session.chatId) {
      try {
        const extra: any = {
          parse_mode: 'Markdown',
          reply_markup: this.getAppButton('📱 Открыть карточку', session.chatId > 0)
            .text('✅ В сценарий', `approve_idea_${taskId}`)
        };
        if (session.threadId) {
          extra.message_thread_id = session.threadId;
        }

        const summaryText =
          `💡 **Идея сохранена в приложении**\n\n` +
          `📌 **#${taskId}: ${mainTitle}**\n` +
          `👤 **Автор:** ${session.userName}\n` +
          (session.voices.length > 0 ? `🎙️ Голосовых заметок: ${session.voices.length}\n` : '') +
          (session.links.length > 0 ? `🔗 Референсов: ${session.links.length}\n` : '') +
          (session.texts.length > 0 ? `📝 Текст зафиксирован в карточке\n` : '') +
          `\n_Карточка создана на конвейере Production Hub._`;

        await this.bot.api.sendMessage(session.chatId, summaryText, extra);
      } catch (err) {
        console.warn('[TelegramBot] Не удалось отправить итоговое сообщение идеи:', err);
      }
    }
  }

  private async cancelIdeaSession(sessionKey: string, triggerMessageId?: number) {
    const session = this.ideaSessions.get(sessionKey);
    if (!session) return;
    this.ideaSessions.delete(sessionKey);

    for (const msgId of session.technicalMessageIds) {
      try {
        await this.bot?.api.deleteMessage(session.chatId, msgId);
      } catch (e) {}
    }

    if (triggerMessageId) {
      try {
        await this.bot?.api.deleteMessage(session.chatId, triggerMessageId);
      } catch (e) {}
    }
  }

  private setupHandlers() {
    if (!this.bot) return;

    // Error boundary
    this.bot.catch((err) => {
      console.error('❌ [TelegramBot] Перехвачена ошибка в обработчике:', err.message || err);
    });

    // Logging middleware
    this.bot.use(async (ctx, next) => {
      const from = ctx.from?.username ? `@${ctx.from.username}` : `id:${ctx.from?.id || 'unknown'}`;
      const text = ctx.message?.text || ctx.callbackQuery?.data || '(event)';
      console.log(`📩 [TelegramBot] Получено событие от ${from}: ${text}`);
      await next();
    });

    // Command /start (handles deep linking or direct start)
    this.bot.command('start', async (ctx) => {
      const payload = ctx.match; // e.g. "idea_-1002145893201"
      const userId = ctx.from?.id;
      const userName = `${ctx.from?.first_name || ''} ${ctx.from?.last_name || ''}`.trim() || ctx.from?.username || 'Участник';

      if (!userId) return;

      if (payload && payload.startsWith('idea_')) {
        const rawChatId = payload.replace('idea_', '');
        const targetChatId = Number(rawChatId);
        await this.startIdeaSession(ctx.chat.id, undefined, userId, userName);
        return;
      }

      const isPrivate = ctx.chat.type === 'private';
      await ctx.reply(
        `👋 Привет, ${userName}!\n` +
        `Я координационный бот **Production Hub**.\n\n` +
        `📱 Чтобы открыть веб-приложение, нажми кнопку ниже или кнопку **Меню** в левом нижнем углу:`,
        {
          reply_markup: this.getAppButton('📱 Открыть Production Hub', isPrivate)
        }
      );
    });

    // Command /help
    this.bot.command('help', async (ctx) => {
      await ctx.reply(
        `ℹ️ **Production Hub — Справка**\n\n` +
        `• 📱 Нажмите кнопку ниже, чтобы открыть Mini App управления производством\n` +
        `• 💡 Отправьте \`/idea\` в топике «Идеи и подборки», чтобы начать запись идеи\n` +
        `• 🗣 Отправляйте голосовые сообщения и ссылки прямо в топик идей — они сохранятся в приложении\n` +
        `• ⚡ Для создания топиков в новой группе отправьте команду \`/scaffold\``,
        {
          parse_mode: 'Markdown',
          reply_markup: this.getAppButton('📱 Открыть Production Hub', ctx.chat.type === 'private')
        }
      );
    });

    // Command /idea or /newidea (starts idea session in current chat / topic)
    this.bot.command(['idea', 'newidea'], async (ctx) => {
      const chatId = ctx.chat.id;
      const threadId = ctx.message?.message_thread_id;
      const userId = ctx.from?.id;
      const userName = `${ctx.from?.first_name || ''} ${ctx.from?.last_name || ''}`.trim() || ctx.from?.username || 'Участник';
      if (!userId) return;

      // Delete user's command message to keep chat spotless
      try {
        await ctx.api.deleteMessage(chatId, ctx.message.message_id);
      } catch (e) {}

      await this.startIdeaSession(chatId, threadId, userId, userName);
    });

    // Command /done or /finish (finishes active idea session)
    this.bot.command(['done', 'finish'], async (ctx) => {
      const chatId = ctx.chat.id;
      const threadId = ctx.message?.message_thread_id;
      const userId = ctx.from?.id;
      if (!userId) return;

      const session = this.getIdeaSession(chatId, threadId, userId);
      if (session) {
        await this.finishIdeaSession(session.key, ctx.message?.message_id);
      }
    });

    // Command /cancel (cancels active idea session and cleans up)
    this.bot.command(['cancel'], async (ctx) => {
      const chatId = ctx.chat.id;
      const threadId = ctx.message?.message_thread_id;
      const userId = ctx.from?.id;
      if (!userId) return;

      const session = this.getIdeaSession(chatId, threadId, userId);
      if (session) {
        await this.cancelIdeaSession(session.key, ctx.message?.message_id);
      }
    });

    // Callback query when clicking "💡 Новая идея" in topic
    this.bot.callbackQuery('start_topic_idea', async (ctx) => {
      const chatId = ctx.chat?.id;
      const threadId = ctx.callbackQuery.message?.message_thread_id;
      const userId = ctx.from?.id;
      const userName = `${ctx.from?.first_name || ''} ${ctx.from?.last_name || ''}`.trim() || ctx.from?.username || 'Участник';
      if (!chatId || !userId) return;

      await ctx.answerCallbackQuery();
      await this.startIdeaSession(chatId, threadId, userId, userName);
    });

    // Callback query for finishing an idea session
    this.bot.callbackQuery(/^finish_idea_(.+)$/, async (ctx) => {
      const sessionKey = ctx.match[1];
      await ctx.answerCallbackQuery({ text: 'Сохраняю идею...' });
      await this.finishIdeaSession(sessionKey);
    });

    // Backward compatibility for DM finish button
    this.bot.callbackQuery('finish_idea', async (ctx) => {
      const userId = ctx.from?.id;
      const chatId = ctx.chat?.id;
      if (!userId || !chatId) return;

      const session = this.getIdeaSession(chatId, undefined, userId);
      if (session) {
        await ctx.answerCallbackQuery({ text: 'Сохраняю идею...' });
        await this.finishIdeaSession(session.key);
      } else {
        await ctx.answerCallbackQuery({ text: 'Сессия уже завершена.' });
      }
    });

    // Callback query for canceling an idea session
    this.bot.callbackQuery(/^cancel_idea_(.+)$/, async (ctx) => {
      const sessionKey = ctx.match[1];
      await ctx.answerCallbackQuery({ text: 'Запись отменена' });
      await this.cancelIdeaSession(sessionKey);
    });

    // Callback query for approving idea to script
    this.bot.callbackQuery(/^approve_idea_(\w+)$/, async (ctx) => {
      const taskId = ctx.match[1];
      await ctx.answerCallbackQuery({ text: '✅ Идея утверждена в сценарий!' });
      this.onTaskApproved?.(taskId);
      try {
        await ctx.editMessageReplyMarkup({
          reply_markup: this.getAppButton('📱 Открыть сценарий в приложении', ctx.chat?.id ? ctx.chat.id > 0 : false)
        });
      } catch (e) {}
    });

    // Command /scaffold, /setup or /init in group chat
    this.bot.command(['scaffold', 'setup', 'init'], async (ctx) => {
      if (ctx.chat.type === 'private') {
        await ctx.reply('⚠️ Эту команду нужно запускать в супергруппе проекта.');
        return;
      }

      const chatTitle = ctx.chat.title || 'Проект';

      if (this.hasExistingTopics?.(ctx.chat.id)) {
        const kb = this.getAppButton('📱 Открыть Production Hub');
        await ctx.reply(`✅ В проекте «${chatTitle}» все топики уже созданы и активны.`, { reply_markup: kb });
        return;
      }
      const fromUser = ctx.from;
      const creatorName = `${fromUser?.first_name || ''} ${fromUser?.last_name || ''}`.trim() || fromUser?.username || 'Администратор';
      const creatorUsername = fromUser?.username ? `@${fromUser.username}` : undefined;

      const creatorMember: ProjectMember = {
        id: `tg-${fromUser?.id || Date.now()}`,
        telegramUserId: fromUser?.id,
        name: creatorName,
        username: creatorUsername,
        roles: ['producer'],
        isCreator: true
      };

      let progressMsg: any = null;
      try {
        progressMsg = await ctx.reply(`🚀 Запускаю создание структуры из 9 топиков конвейера для проекта «${chatTitle}»...`);
        const topics = await this.scaffoldChatTopics(ctx.chat.id, chatTitle);

        this.onProjectScaffolded?.(ctx.chat.id, chatTitle, topics, [creatorMember], false);

        // Delete intermediate progress message to prevent spam
        if (progressMsg?.message_id) {
          await ctx.api.deleteMessage(ctx.chat.id, progressMsg.message_id).catch(() => {});
        }
        // Delete user's command message
        if (ctx.message?.message_id) {
          await ctx.api.deleteMessage(ctx.chat.id, ctx.message.message_id).catch(() => {});
        }

        const kb = this.getAppButton('📱 Определить роли команды');

        await ctx.reply(
          `🎉 **Production Hub подключен к проекту «${chatTitle}»!**\n\n` +
          `✅ Все 9 топиков успешно созданы!\n` +
          `👤 **Создатель:** ${creatorName} (${creatorUsername || 'Продюсер / админ'})\n\n` +
          `⚠️ **Следующий шаг:** перейдите в приложение, чтобы определить роли участников команды:\n` +
          `• Эксперт\n` +
          `• Продюсер / админ\n` +
          `• Проектный менеджер\n` +
          `• Рилсмейкер\n` +
          `• Дизайнер\n` +
          `• Оператор\n` +
          `• СММ\n` +
          `• Ассистент\n\n` +
          `*Идентификация проекта завершится после назначения ролей 👇*`,
          { parse_mode: 'Markdown', reply_markup: kb }
        );
      } catch (err: any) {
        if (progressMsg?.message_id) {
          await ctx.api.deleteMessage(ctx.chat.id, progressMsg.message_id).catch(() => {});
        }
        console.error('[TelegramBot] Ошибка создания топиков по команде:', err);
        const errMsg = err?.description || err?.message || String(err);
        let instructions = '';

        if (errMsg.includes('not a forum') || errMsg.includes('TOPICS_RESTRICTED')) {
          instructions = 
            `💡 **В этой группе выключены темы (форум).**\n\n` +
            `👉 **Как исправить:**\n` +
            `1. Зайдите в **«Настройки группы»** (Редактировать / значок карандаша).\n` +
            `2. Найдите пункт **«Темы» (Topics)** и включите его.\n` +
            `3. Убедитесь, что у бота есть право **«Управление темами»** в списке администраторов.\n\n` +
            `После включения отправьте команду \`/scaffold\` ещё раз!`;
        } else if (errMsg.includes('not enough rights') || errMsg.includes('CHAT_ADMIN_REQUIRED')) {
          instructions = 
            `💡 **Боту не хватает прав администратора.**\n\n` +
            `👉 **Как исправить:**\n` +
            `1. Откройте профиль бота в группе.\n` +
            `2. Сделайте его **Администратором** и включите галочку **«Управление темами»**.\n\n` +
            `После этого отправьте команду \`/scaffold\` ещё раз!`;
        } else {
          instructions = `⚠️ **Не удалось создать топики:** ${errMsg}\n\nУбедитесь, что темы в группе включены и у бота есть права администратора.`;
        }

        await ctx.reply(instructions, { parse_mode: 'Markdown' });
      }
    });

    // Auto-detect when bot is added to a group or promoted to admin
    this.bot.on('my_chat_member', async (ctx) => {
      const update = ctx.myChatMember;
      const chat = update.chat;
      const status = update.new_chat_member.status;
      const oldStatus = update.old_chat_member.status;

      if (chat.type !== 'supergroup' && chat.type !== 'group') return;

      console.log(`🔔 [TelegramBot] Статус бота в группе «${chat.title}» (${chat.id}) изменился: ${oldStatus} -> ${status}`);

      if (status === 'administrator') {
        const chatTitle = chat.title || 'Новый проект';

        if (this.hasExistingTopics?.(chat.id)) {
          console.log(`ℹ️ [TelegramBot] Проект «${chatTitle}» (${chat.id}) уже имеет созданные топики. Пропускаем.`);
          return;
        }
        const addedByUser = update.from;
        const creatorName = `${addedByUser.first_name || ''} ${addedByUser.last_name || ''}`.trim() || addedByUser.username || 'Администратор';
        const creatorUsername = addedByUser.username ? `@${addedByUser.username}` : undefined;

        const creatorMember: ProjectMember = {
          id: `tg-${addedByUser.id}`,
          telegramUserId: addedByUser.id,
          name: creatorName,
          username: creatorUsername,
          roles: ['producer'],
          isCreator: true
        };

        try {
          const introMsg = await ctx.reply(
            `🎉 **Production Hub подключен к проекту «${chatTitle}»!**\n\n` +
            `✅ Права администратора получены.\n` +
            `⚡ Автоматически создаю **9 рабочих топиков** конвейера...`,
            { parse_mode: 'Markdown' }
          );

          const topics = await this.scaffoldChatTopics(chat.id, chatTitle);

          this.onProjectScaffolded?.(chat.id, chatTitle, topics, [creatorMember], false);

          await ctx.api.deleteMessage(chat.id, introMsg.message_id).catch(() => {});

          const kb = this.getAppButton('📱 Определить роли команды');

          await ctx.reply(
            `🎉 **Топики успешно созданы!**\n\n` +
            `✅ Создано 9 рабочих топиков конвейера.\n` +
            `👤 **Создатель:** ${creatorName} (${creatorUsername || 'Продюсер / админ'})\n\n` +
            `⚠️ **Следующий шаг:** перейдите в приложение, чтобы определить роли участников команды:\n` +
            `• Эксперт\n` +
            `• Продюсер / админ\n` +
            `• Проектный менеджер\n` +
            `• Рилсмейкер\n` +
            `• Дизайнер\n` +
            `• Оператор\n` +
            `• СММ\n` +
            `• Ассистент\n\n` +
            `*Идентификация проекта завершится после назначения ролей 👇*`,
            { parse_mode: 'Markdown', reply_markup: kb }
          );
        } catch (err: any) {
          console.warn('[TelegramBot] Не удалось автоматически создать топики при назначении админом:', err?.message || err);
          const retryKb = new InlineKeyboard().text('🚀 Развернуть 9 топиков', `scaffold_here_${chat.id}`);
          await ctx.reply(`💡 Для создания топиков убедитесь, что темы в группе включены, и нажмите кнопку:`, {
            reply_markup: retryKb
          });
        }
      } else if (status === 'member') {
        const kb = new InlineKeyboard()
          .text('🚀 Развернуть 9 топиков', `scaffold_here_${chat.id}`);

        await ctx.reply(
          `👋 **Привет! Я бот конвейера Production Hub.**\n\n` +
          `Я привязал этот чат как проект: **«${chat.title}»** (ID: \`${chat.id}\`).\n\n` +
          `⚙️ **Чтобы запустить конвейер:**\n` +
          `1️⃣ Включите **«Темы» (Topics / Форум)** в настройках группы.\n` +
          `2️⃣ Назначьте меня **Администратором** с правами **«Управление темами»** и **«Удаление сообщений»**.\n\n` +
          `Как только дадите права, нажмите кнопку ниже:`,
          { parse_mode: 'Markdown', reply_markup: kb }
        );
      }
    });

    // Callback when clicking manual scaffold button in group
    this.bot.callbackQuery(/^scaffold_here_(-?\d+)$/, async (ctx) => {
      const targetChatId = ctx.chat?.id || Number(ctx.match[1]);
      const chatTitle = ctx.chat?.title || 'Проект';

      if (this.hasExistingTopics?.(targetChatId)) {
        const kb = this.getAppButton('📱 Открыть Production Hub');
        await ctx.reply(`✅ В проекте «${chatTitle}» все топики уже созданы и активны.`, { reply_markup: kb });
        return;
      }
      const fromUser = ctx.from;
      const creatorName = `${fromUser.first_name || ''} ${fromUser.last_name || ''}`.trim() || fromUser.username || 'Администратор';
      const creatorUsername = fromUser.username ? `@${fromUser.username}` : undefined;

      const creatorMember: ProjectMember = {
        id: `tg-${fromUser.id}`,
        telegramUserId: fromUser.id,
        name: creatorName,
        username: creatorUsername,
        roles: ['producer'],
        isCreator: true
      };

      let progressMsg: any = null;
      try {
        progressMsg = await ctx.reply('⏳ Разворачиваю 9 топиков конвейера...');
        const topics = await this.scaffoldChatTopics(targetChatId, chatTitle);

        this.onProjectScaffolded?.(targetChatId, chatTitle, topics, [creatorMember], false);

        if (progressMsg?.message_id) {
          await ctx.api.deleteMessage(targetChatId, progressMsg.message_id).catch(() => {});
        }

        const kb = this.getAppButton('📱 Определить роли команды');

        await ctx.reply(
          `🎉 **Production Hub подключен к проекту «${chatTitle}»!**\n\n` +
          `✅ Создано 9 рабочих топиков конвейера.\n` +
          `👤 **Создатель:** ${creatorName} (${creatorUsername || 'Продюсер / админ'})\n\n` +
          `⚠️ **Следующий шаг:** перейдите в приложение, чтобы определить роли команды 👇`,
          { parse_mode: 'Markdown', reply_markup: kb }
        );
      } catch (err: any) {
        if (progressMsg?.message_id) {
          await ctx.api.deleteMessage(targetChatId, progressMsg.message_id).catch(() => {});
        }
        console.error('[TelegramBot] Ошибка создания топиков:', err);
        const retryKb = new InlineKeyboard().text('🚀 Попробовать снова', `scaffold_here_${targetChatId}`);
        await ctx.reply(`⚠️ Не удалось создать топики: ${err?.message || err}`, { reply_markup: retryKb });
      }
    });

    // Traditional group invite
    this.bot.on(':new_chat_members', async (ctx) => {
      const me = await ctx.api.getMe();
      const botAdded = ctx.message?.new_chat_members?.some(u => u.id === me.id);
      if (!botAdded) return;

      const chat = ctx.chat;
      const kb = new InlineKeyboard().text('🚀 Развернуть 9 топиков', `scaffold_here_${chat.id}`);

      await ctx.reply(
        `👋 **Привет! Я бот Production Hub.**\n\n` +
        `Сделайте меня **Администратором** с правами **«Управление темами»** и я сам создам всю рабочую структуру конвейера!`,
        { parse_mode: 'Markdown', reply_markup: kb }
      );
    });

    // Auto-update project name when chat title changes in Telegram
    this.bot.on('message:new_chat_title', async (ctx) => {
      const newTitle = ctx.message.new_chat_title;
      console.log(`📝 [TelegramBot] Название группы изменено на «${newTitle}» (chatId: ${ctx.chat.id})`);
      this.onProjectScaffolded?.(ctx.chat.id, newTitle, {});
    });

    // Capture Voice Messages (in active session or auto-start in ideas topic / DM)
    this.bot.on('message:voice', async (ctx) => {
      const chatId = ctx.chat.id;
      const threadId = ctx.message.message_thread_id;
      const userId = ctx.from?.id;
      const userName = `${ctx.from?.first_name || ''} ${ctx.from?.last_name || ''}`.trim() || ctx.from?.username || 'Участник';
      if (!userId) return;

      const voice = ctx.message.voice;

      // 1. If an active recording session exists: download and save silently!
      let session = this.getIdeaSession(chatId, threadId, userId);
      if (session) {
        try {
          const localUrl = await saveVoiceFile(this.token, voice.file_id, voice.file_unique_id);
          session.voices.push({
            id: `voice-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            url: localUrl,
            duration: voice.duration,
            senderName: userName,
            createdAt: new Date().toISOString()
          });
          // NO SPAM: zero replies sent during active recording!
        } catch (err) {
          console.warn('[TelegramBot] Ошибка сохранения голосового сообщения:', err);
        }
        return;
      }

      // 2. If NO active session, but voice was sent in the ideas topic or DM: auto-start idea session!
      if (this.isIdeasTopic(chatId, threadId)) {
        try {
          const localUrl = await saveVoiceFile(this.token, voice.file_id, voice.file_unique_id);
          const voiceItem: VoiceNoteItem = {
            id: `voice-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            url: localUrl,
            duration: voice.duration,
            senderName: userName,
            createdAt: new Date().toISOString()
          };
          await this.startIdeaSession(chatId, threadId, userId, userName, voiceItem);
        } catch (err) {
          console.warn('[TelegramBot] Ошибка старта сессии с голосовым:', err);
        }
      }
    });

    // Capture Text & Links (in active session)
    this.bot.on('message:text', async (ctx) => {
      const chatId = ctx.chat.id;
      const threadId = ctx.message.message_thread_id;
      const userId = ctx.from?.id;
      const userName = `${ctx.from?.first_name || ''} ${ctx.from?.last_name || ''}`.trim() || ctx.from?.username || 'Участник';
      if (!userId) return;

      const text = ctx.message.text.trim();

      // Check if user is in an active idea recording session
      const session = this.getIdeaSession(chatId, threadId, userId);
      if (session) {
        session.texts.push(text);
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const matches = text.match(urlRegex);
        if (matches) {
          session.links.push(...matches);
        }
        // NO SPAM: silently collected without sending "добавлено к идее"!
        return;
      }

      // If user is in private DM with bot and no session is active: show greeting with app button
      if (ctx.chat.type === 'private' && !text.startsWith('/')) {
        await ctx.reply(
          `👋 Я бот **Production Hub**.\n\n` +
          `📱 Чтобы открыть веб-приложение, нажми кнопку ниже:`,
          {
            reply_markup: this.getAppButton('📱 Открыть Production Hub', true)
          }
        );
      }
    });
  }

  // Scaffolding all 9 topics in a supergroup
  public async scaffoldChatTopics(chatId: number, chatTitle: string): Promise<ProjectTopics> {
    const topicMap: ProjectTopics = {};

    if (this.bot) {
      let lastError: any = null;
      for (const t of TOPIC_DEFINITIONS) {
        try {
          const params: any = {
            icon_color: t.iconColor
          };
          if ((t as any).iconCustomEmojiId) {
            params.icon_custom_emoji_id = (t as any).iconCustomEmojiId;
          }
          const result = await this.bot.api.createForumTopic(chatId, t.name, params);
          (topicMap as any)[t.key] = result.message_thread_id;
          console.log(`✅ [TelegramBot] Создан топик: ${t.name} (id: ${result.message_thread_id})`);
        } catch (err: any) {
          lastError = err;
          console.warn(`⚠️ [TelegramBot] Не удалось создать топик ${t.name}:`, err?.message || err);
        }
      }

      if (Object.keys(topicMap).length === 0 && lastError) {
        throw lastError;
      }

      // Starter message in Topic 1 with topic-based idea recording button
      if (topicMap.ideas) {
        try {
          await this.bot.api.sendMessage(
            chatId,
            `💡 **Топик: Идеи и подборки**\n\n` +
            `Здесь фиксируются все идеи для контента проекта.\n\n` +
            `• Отправляйте команду \`/idea\` или нажмите кнопку ниже для записи новой идеи\n` +
            `• Отправляйте мысли, ссылки и голосовые сообщения — они сохранятся прямо в приложении`,
            {
              message_thread_id: topicMap.ideas,
              parse_mode: 'Markdown',
              reply_markup: new InlineKeyboard().text('💡 Записать новую идею', 'start_topic_idea')
            }
          );
        } catch (e) {
          console.warn('[TelegramBot] Ошибка отправки стартового сообщения в топик идей:', e);
        }
      }
    } else {
      // Simulation mode
      TOPIC_DEFINITIONS.forEach((t, i) => {
        (topicMap as any)[t.key] = 100 + i;
      });
    }

    this.onProjectScaffolded?.(chatId, chatTitle, topicMap);
    return topicMap;
  }

  // Check and send call reminders (1 hour and 15 minutes before)
  public async checkCallReminders(calls: CallEvent[]) {
    if (!this.bot) return;

    const now = Date.now();

    for (const call of calls) {
      if (!call.date || !call.time) continue;
      const callDateTime = new Date(`${call.date}T${call.time}:00`).getTime();
      const diffMs = callDateTime - now;
      const diffMins = Math.round(diffMs / 60000);

      // 1 hour reminder (between 55 and 65 mins)
      if (diffMins >= 55 && diffMins <= 65 && !call.reminded1h) {
        call.reminded1h = true;
        this.onCallUpdated?.(call);
        await this.broadcastCallAlert(call, 'через 1 час');
      }

      // 15 minutes reminder (between 10 and 17 mins)
      if (diffMins >= 10 && diffMins <= 17 && !call.reminded15m) {
        call.reminded15m = true;
        this.onCallUpdated?.(call);
        await this.broadcastCallAlert(call, 'через 15 минут');
      }
    }
  }

  private async broadcastCallAlert(call: CallEvent, timeLabel: string) {
    if (!this.bot) return;
    const text = 
      `📞 **Напоминание о созвоне ${timeLabel}!**\n\n` +
      `📌 **Тема:** ${call.title}\n` +
      `⏰ **Время:** ${call.time} (${call.durationMinutes} мин)\n` +
      `👥 **Участники:** ${call.participants.join(', ')}\n` +
      `🔗 **Ссылка:** ${call.link}`;

    const kb = new InlineKeyboard().url('🎙️ Подключиться к созвону', call.link);

    if (call.projectId) {
      try {
        await this.bot.api.sendMessage(Number(call.projectId), text, {
          parse_mode: 'Markdown',
          reply_markup: kb
        });
      } catch (e) {
        console.warn('[TelegramBot] Не удалось отправить напоминание в чат созвона:', e);
      }
    }
  }

  public async notifyProjectSetupComplete(chatId: number, chatTitle: string, members: ProjectMember[]) {
    if (!this.bot) return;
    try {
      const rolesSummary = members.map(m => {
        const roleLabels = m.roles.map(r => {
          const found = TEAM_ROLES.find(tr => tr.id === r);
          return found ? found.label : r;
        }).join(', ');
        return `• **${m.name}** (${m.username || 'ТГ'}): ${roleLabels}`;
      }).join('\n');

      const kb = this.getAppButton('📱 Открыть Production Hub');

      await this.bot.api.sendMessage(
        chatId,
        `🚀 **Идентификация проекта «${chatTitle}» успешно завершена!**\n\n` +
        `👥 **Распределение ролей команды:**\n${rolesSummary || '• Роли определены'}\n\n` +
        `Конвейер контента активен. Нажмите кнопку ниже, чтобы начать работу 👇`,
        {
          parse_mode: 'Markdown',
          reply_markup: kb
        }
      );
    } catch (err: any) {
      console.warn('[TelegramBot] Ошибка отправки уведомления об идентификации проекта:', err.message);
    }
  }

  public async sendTopicIdeaButton(chatId: number, threadId: number) {
    if (!this.bot) return;
    try {
      await this.bot.api.sendMessage(
        chatId,
        `💡 **Идеи и подборки**\n\n` +
        `Нажмите кнопку ниже или отправьте команду \`/idea\`, чтобы записать новую идею в конвейер проекта:`,
        {
          message_thread_id: threadId,
          parse_mode: 'Markdown',
          reply_markup: new InlineKeyboard().text('💡 Записать новую идею', 'start_topic_idea')
        }
      );
    } catch (e) {
      console.warn('[TelegramBot] Ошибка отправки кнопки записи идеи:', e);
    }
  }

  public async start() {
    if (this.bot && !this.isRunning) {
      this.isRunning = true;
      console.log('🤖 [TelegramBot] Бот запущен и слушает события...');
      this.bot.start({
        allowed_updates: ['message', 'callback_query', 'my_chat_member', 'chat_member'],
        onStart: async (info) => {
          console.log(`🚀 [TelegramBot] Авторизован как @${info.username}`);
          if (this.appUrl && this.appUrl.startsWith('https://')) {
            try {
              await this.bot?.api.setChatMenuButton({
                menu_button: {
                  type: 'web_app',
                  text: 'Production Hub',
                  web_app: { url: this.appUrl }
                }
              });
              console.log(`📱 [TelegramBot] Меню-кнопка Web App установлена: ${this.appUrl}`);
            } catch (e: any) {
              console.warn('⚠️ [TelegramBot] Ошибка установки MenuButton:', e.message);
            }
          }
          try {
            await this.bot?.api.setMyCommands([
              { command: 'start', description: 'Запустить бота и открыть Production Hub' },
              { command: 'idea', description: '💡 Начать запись новой идеи контента' },
              { command: 'done', description: '✅ Завершить запись идеи' },
              { command: 'cancel', description: '❌ Отменить запись идеи' },
              { command: 'scaffold', description: 'Развернуть структуру 9 топиков в супергруппе' },
              { command: 'help', description: 'Справка по конвейеру контента' }
            ]);
          } catch (e: any) {
            console.warn('⚠️ [TelegramBot] Ошибка регистрации команд:', e.message);
          }
        }
      }).catch(err => {
        console.error('❌ [TelegramBot] Ошибка polling:', err);
        this.isRunning = false;
      });
    }
  }

  public stop() {
    if (this.bot && this.isRunning) {
      this.bot.stop();
      this.isRunning = false;
      console.log('🛑 [TelegramBot] Бот остановлен.');
    }
  }
}

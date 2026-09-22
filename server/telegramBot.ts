import { Bot, InlineKeyboard } from 'grammy';
import { Project, ProjectTopics, TaskCard, CallEvent, ProjectMember, TEAM_ROLES } from '../src/types.ts';

export interface BotConfig {
  token: string;
  appUrl?: string;
  geminiApiKey?: string;
}

export const TOPIC_DEFINITIONS = [
  { key: 'ideas',        name: '1. ⚡ Идеи и подборки', iconColor: 0xFFD67E },
  { key: 'scripts',      name: '2. 📝 Сценарии',        iconColor: 0x6FB9F0 },
  { key: 'shooting',     name: '3. 🎬 Съёмка',          iconColor: 0xFB6F5F },
  { key: 'materials',    name: '4. 📁 Материалы',       iconColor: 0xCB86DB },
  { key: 'reels',        name: '5. 📱 Рилсы',           iconColor: 0x8EEE98 },
  { key: 'carousels',    name: '6. 🎠 Карусели',       iconColor: 0xFF93B2 },
  { key: 'stories',      name: '7. 👀 Сторис',          iconColor: 0xFFD67E },
  { key: 'publications', name: '8. 📣 Публикации',      iconColor: 0x6FB9F0 },
  { key: 'calls',        name: '🎙️ Созвоны',            iconColor: 0x8EEE98 },
] as const;

interface IdeaSession {
  chatId: number;
  userId: number;
  userName: string;
  texts: string[];
  links: string[];
  voices: { id: string; url: string; duration?: number; textTranscript?: string }[];
  startedAt: number;
}

export class ProductionTelegramBot {
  private bot: Bot | null = null;
  private token: string = '';
  private appUrl: string = 'http://localhost:3000';
  private geminiApiKey: string = '';
  private ideaSessions = new Map<number, IdeaSession>(); // userId -> session
  private isRunning: boolean = false;
  
  // Callbacks to interact with shared database
  private onTaskCreated?: (task: TaskCard) => void;
  private onCallUpdated?: (call: CallEvent) => void;
  private onProjectScaffolded?: (chatId: number, chatTitle: string, topics: ProjectTopics, members?: ProjectMember[], isSetupComplete?: boolean) => void;

  constructor(config: BotConfig, callbacks?: {
    onTaskCreated?: (task: TaskCard) => void;
    onCallUpdated?: (call: CallEvent) => void;
    onProjectScaffolded?: (chatId: number, chatTitle: string, topics: ProjectTopics, members?: ProjectMember[], isSetupComplete?: boolean) => void;
  }) {
    this.token = config.token;
    this.appUrl = config.appUrl || 'http://localhost:3000';
    this.geminiApiKey = config.geminiApiKey || '';
    this.onTaskCreated = callbacks?.onTaskCreated;
    this.onCallUpdated = callbacks?.onCallUpdated;
    this.onProjectScaffolded = callbacks?.onProjectScaffolded;

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
      this.setupHandlers();
      this.start();
    } catch (err) {
      console.error('❌ [TelegramBot] Ошибка инициализации бота:', err);
    }
  }

  private getAppButton(text: string = '📱 Открыть Production Hub'): InlineKeyboard {
    const kb = new InlineKeyboard();
    if (this.appUrl && this.appUrl.startsWith('https://')) {
      return kb.webApp(text, this.appUrl);
    }
    return kb.url(text, this.appUrl || 'http://localhost:3000');
  }

  private setupHandlers() {
    if (!this.bot) return;

    // Log all incoming interactions
    this.bot.use(async (ctx, next) => {
      const from = ctx.from?.username ? `@${ctx.from.username}` : `id:${ctx.from?.id || 'unknown'}`;
      const text = ctx.message?.text || ctx.callbackQuery?.data || '(event)';
      console.log(`📩 [TelegramBot] Получено событие от ${from}: ${text}`);
      await next();
    });

    // Command /start (handles deep linking from group topics)
    this.bot.command('start', async (ctx) => {
      const payload = ctx.match; // e.g. "idea_-1002145893201"
      const userId = ctx.from?.id;
      const userName = ctx.from?.first_name || 'Участник';

      if (!userId) return;

      if (payload && payload.startsWith('idea_')) {
        const rawChatId = payload.replace('idea_', '');
        const targetChatId = Number(rawChatId);

        this.ideaSessions.set(userId, {
          chatId: targetChatId,
          userId,
          userName,
          texts: [],
          links: [],
          voices: [],
          startedAt: Date.now()
        });

        const keyboard = new InlineKeyboard().text('✅ Завершить и отправить идею', 'finish_idea');

        await ctx.reply(
          `🎙️ **Запись идеи началась!**\n\n` +
          `Кидай сюда всё подряд:\n` +
          `• Голосовые сообщения и мысли\n` +
          `• Ссылки на YouTube Shorts / Instagram Reels\n` +
          `• Текстовые заметки и комментарии\n\n` +
          `Когда закончишь — нажми кнопку ниже 👇`,
          { parse_mode: 'Markdown', reply_markup: keyboard }
        );
        return;
      }

      // Default /start
      await ctx.reply(
        `👋 Привет, ${userName}!\n` +
        `Я координационный бот **Production Hub**.\n\n` +
        `📱 Чтобы открыть веб-приложение, нажми кнопку ниже или кнопку **Меню** в левом нижнем углу:`,
        {
          reply_markup: this.getAppButton('📱 Открыть Production Hub')
        }
      );
    });

    // Command /help
    this.bot.command('help', async (ctx) => {
      await ctx.reply(
        `ℹ️ **Production Hub — Справка**\n\n` +
        `• 📱 Нажмите кнопку ниже, чтобы открыть Mini App управления производством контента\n` +
        `• ⚡ Для подключения к проекту добавьте бота администратором в супергруппу с темами (топиками)\n` +
        `• 🎙️ Чтобы надиктовать идею, перейдите по ссылке из топика «1. Идеи и подборки»`,
        {
          parse_mode: 'Markdown',
          reply_markup: this.getAppButton('📱 Открыть Production Hub')
        }
      );
    });

    // Command /scaffold, /setup or /init in group chat
    this.bot.command(['scaffold', 'setup', 'init'], async (ctx) => {
      if (ctx.chat.type === 'private') {
        await ctx.reply('⚠️ Эту команду нужно запускать в супергруппе проекта.');
        return;
      }

      await ctx.reply(`🚀 Запускаю создание структуры из 9 топиков конвейера для проекта «${ctx.chat.title || 'Проект'}»...`);
      await this.scaffoldChatTopics(ctx.chat.id, ctx.chat.title || 'Проект');
      await ctx.reply('✅ Все 9 топиков успешно созданы! Проект синхронизирован с Production Hub.');
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
        const canManageTopics = (update.new_chat_member as any).can_manage_topics;
        const chatTitle = chat.title || 'Новый проект';

        if (canManageTopics) {
          // Бот уже имеет права управления темами -> Автоматически разворачиваем структуру!
          await ctx.reply(
            `🎉 **Production Hub подключен к проекту «${chatTitle}»!**\n\n` +
            `✅ Права администратора получены.\n` +
            `🆔 **Chat ID:** \`${chat.id}\`\n\n` +
            `⚡ Автоматически создаю **9 рабочих топиков** конвейера...`,
            { parse_mode: 'Markdown' }
          );

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

          const topics = await this.scaffoldChatTopics(chat.id, chatTitle);

          // Notify server database (isSetupComplete: false)
          this.onProjectScaffolded?.(chat.id, chatTitle, topics, [creatorMember], false);

          const kb = this.getAppButton('📱 Определить роли команды');

          await ctx.reply(
            `🎉 **Production Hub подключен к проекту «${chatTitle}»!**\n\n` +
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
        } else {
          const kb = new InlineKeyboard()
            .text('🚀 Развернуть 9 топиков конвейера', `scaffold_here_${chat.id}`);

          await ctx.reply(
            `👋 **Production Hub подключен к проекту «${chatTitle}»!**\n\n` +
            `⚠️ Чтобы я автоматически создал 9 топиков, включите мне разрешение:\n` +
            `• 🏷️ **Управление темами** (can_manage_topics)\n` +
            `• 🗑️ **Удаление сообщений** (can_delete_messages)\n\n` +
            `После включения нажмите кнопку ниже 👇`,
            { parse_mode: 'Markdown', reply_markup: kb }
          );
        }
      } else if (status === 'member') {
        const kb = new InlineKeyboard()
          .text('🚀 Развернуть 9 топиков', `scaffold_here_${chat.id}`);

        await ctx.reply(
          `👋 **Привет! Я бот конвейера Production Hub.**\n\n` +
          `Я привязал этот чат как проект: **«${chat.title}»** (ID: \`${chat.id}\`).\n\n` +
          `⚙️ **Чтобы запустить конвейер:**\n` +
          `1️⃣ Включите **«Темы» (Topics / Форум)** в настройках группы.\n` +
          `2️⃣ Назначьте меня **Администратором** с правами:\n` +
          `   • 🏷️ **Управление темами** (для создания 9 топиков)\n` +
          `   • 🗑️ **Удаление сообщений** (для автоочистки созвонов)\n\n` +
          `Как только дадите права, я **автоматически создам все 9 топиков**!`,
          { parse_mode: 'Markdown', reply_markup: kb }
        );
      }
    });

    // Callback when clicking manual scaffold button in group
    this.bot.callbackQuery(/^scaffold_here_(-?\d+)$/, async (ctx) => {
      const targetChatId = Number(ctx.match[1]);
      await ctx.answerCallbackQuery({ text: 'Создаю топики...' });
      await ctx.reply('⏳ Разворачиваю 9 топиков конвейера...');
      await this.scaffoldChatTopics(targetChatId, ctx.chat?.title || 'Проект');
      await ctx.reply('✅ Готово! Все 9 топиков созданы и проект синхронизирован с Production Hub.');
    });

    // When bot is added via traditional group invite
    this.bot.on(':new_chat_members', async (ctx) => {
      const me = await ctx.api.getMe();
      const botAdded = ctx.message.new_chat_members.some(u => u.id === me.id);
      if (!botAdded) return;

      const chat = ctx.chat;
      const kb = new InlineKeyboard()
        .text('🚀 Развернуть 9 топиков', `scaffold_here_${chat.id}`);

      await ctx.reply(
        `👋 **Привет! Я бот Production Hub.**\n\n` +
        `Я вижу этот чат как проект **«${chat.title}»** (Chat ID: \`${chat.id}\`).\n\n` +
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

    // Handle Finish Idea callback
    this.bot.callbackQuery('finish_idea', async (ctx) => {
      const userId = ctx.from?.id;
      if (!userId) return;

      const session = this.ideaSessions.get(userId);
      if (!session) {
        await ctx.answerCallbackQuery({ text: 'Сессия не найдена или уже завершена.' });
        return;
      }

      await ctx.answerCallbackQuery({ text: 'Сохраняю идею...' });
      await this.compileAndPublishIdea(session);
      this.ideaSessions.delete(userId);

      await ctx.editMessageText('✅ **Идея успешно сохранена и отправлена в проект!**\nОна появилась в конвейере и в топике «1. ⚡ Идеи и подборки».', {
        parse_mode: 'Markdown',
        reply_markup: this.getAppButton('📱 Открыть в Production Hub')
      });
    });

    // Catch voice messages in DM
    this.bot.on('message:voice', async (ctx) => {
      if (ctx.chat.type !== 'private') return;
      const userId = ctx.from?.id;
      if (!userId) return;

      const session = this.ideaSessions.get(userId);
      if (!session) {
        await ctx.reply(
          `🎙️ Вы отправили голосовое сообщение. Чтобы записать идею в проект, перейдите по ссылке из топика «1. Идеи и подборки» или откройте приложение:`,
          { reply_markup: this.getAppButton('📱 Открыть Production Hub') }
        );
        return;
      }

      const voice = ctx.message.voice;
      const file = await ctx.getFile();
      const fileUrl = `https://api.telegram.org/file/bot${this.token}/${file.file_path}`;

      session.voices.push({
        id: `voice-${Date.now()}`,
        url: fileUrl,
        duration: voice.duration,
        textTranscript: ''
      });

      await ctx.reply('🎙️ Голосовая заметка принята! Можно наговорить ещё или нажать «Завершить».');
    });

    // Catch text & links in DM
    this.bot.on('message:text', async (ctx) => {
      if (ctx.chat.type !== 'private') return;
      const userId = ctx.from?.id;
      if (!userId) return;

      const session = this.ideaSessions.get(userId);
      if (!session) {
        await ctx.reply(
          `👋 Я бот **Production Hub**.\n\n` +
          `📱 Нажмите кнопку ниже, чтобы открыть веб-приложение, или кнопку **Меню** в левом нижнем углу:`,
          {
            reply_markup: this.getAppButton('📱 Открыть Production Hub')
          }
        );
        return;
      }

      const text = ctx.message.text;
      session.texts.push(text);

      // Extract URLs
      const urlRegex = /(https?:\/\/[^\s]+)/g;
      const matches = text.match(urlRegex);
      if (matches) {
        session.links.push(...matches);
      }

      await ctx.reply('👍 Добавлено к идее. Нажми «Завершить», когда всё готово.');
    });
  }

  // Compile collected inputs into a TaskCard and post into group topic
  private async compileAndPublishIdea(session: IdeaSession) {
    const taskId = String(Math.floor(100 + Math.random() * 900));
    const mainTitle = session.texts[0] ? session.texts[0].slice(0, 80) : 'Новая идея от эксперта';

    const newTask: TaskCard = {
      id: taskId,
      title: mainTitle,
      type: 'reels',
      kind: 'content',
      expertId: 'vera',
      expertName: session.userName,
      projectId: String(session.chatId),
      scriptStatus: 'gray',
      shootingStatus: 'gray',
      editingStatus: 'gray',
      materialsTotalCount: 0,
      pools: [],
      ideaDescription: session.texts.join('\n\n'),
      references: session.links.map((url, i) => ({
        id: `ref-${i}`,
        url,
        platform: url.includes('youtube') ? 'youtube' : url.includes('instagram') ? 'instagram' : 'other',
        title: `Референс #${i + 1}`
      })),
      voiceNotes: session.voices.map(v => ({
        id: v.id,
        url: v.url,
        duration: v.duration,
        senderName: session.userName,
        textTranscript: v.textTranscript,
        createdAt: new Date().toISOString()
      })),
      placement: 'unassigned',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Callback to sync with shared database
    this.onTaskCreated?.(newTask);

    // If bot is active, send aesthetic message into group topic 1
    if (this.bot && session.chatId) {
      try {
        const textMessage = 
          `⚡ **Идея #${taskId}: ${mainTitle}**\n` +
          `👤 Автор: ${session.userName}\n` +
          (session.voices.length > 0 ? `🎙️ Голосовых заметок: ${session.voices.length}\n` : '') +
          (session.links.length > 0 ? `🔗 Референсов: ${session.links.length}\n` : '') +
          (session.texts.length > 1 ? `📝 Дополнительно: ${session.texts.slice(1).join(' ')}\n` : '');

        const kb = this.getAppButton('📱 Открыть карточку')
          .text('✅ Утвердить в сценарий', `approve_idea_${taskId}`);

        await this.bot.api.sendMessage(session.chatId, textMessage, {
          parse_mode: 'Markdown',
          reply_markup: kb
        });
      } catch (err) {
        console.warn('[TelegramBot] Не удалось отправить сообщение в топик чата:', err);
      }
    }
  }

  // Scaffolding all 9 topics in a supergroup
  public async scaffoldChatTopics(chatId: number, chatTitle: string): Promise<ProjectTopics> {
    const topicMap: ProjectTopics = {};

    if (this.bot) {
      for (const t of TOPIC_DEFINITIONS) {
        try {
          const result = await this.bot.api.createForumTopic(chatId, t.name, {
            icon_color: t.iconColor
          });
          (topicMap as any)[t.key] = result.message_thread_id;
          console.log(`✅ [TelegramBot] Создан топик: ${t.name} (id: ${result.message_thread_id})`);
        } catch (err) {
          console.warn(`⚠️ [TelegramBot] Не удалось создать топик ${t.name}:`, err);
        }
      }

      // Pin announcement in Topic 1 with Deep-Link
      if (topicMap.ideas) {
        try {
          const me = await this.bot.api.getMe();
          const startUrl = `https://t.me/${me.username}?start=idea_${chatId}`;
          await this.bot.api.sendMessage(
            chatId,
            `👋 **Добро пожаловать в конвейер производства!**\n\n` +
            `Нажимайте кнопку ниже, чтобы наговаривать идеи в личные сообщения боту — они автоматически сформируются в единую карточку без спама в чат.`,
            {
              message_thread_id: topicMap.ideas,
              parse_mode: 'Markdown',
              reply_markup: new InlineKeyboard().url('💡 Наговорить идею в ЛС', startUrl)
            }
          );
        } catch (e) {
          console.warn('[TelegramBot] Ошибка отправки закрепленного сообщения:', e);
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

    // If projectId (chatId) is known, send alert into chat
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

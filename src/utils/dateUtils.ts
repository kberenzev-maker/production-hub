export const RUSSIAN_MONTHS = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
];

export const RUSSIAN_MONTHS_GENITIVE = [
  'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
];

export const RUSSIAN_MONTHS_SHORT = [
  'янв.', 'фев.', 'мар.', 'апр.', 'мая', 'июн.',
  'июл.', 'авг.', 'сен.', 'окт.', 'ноя.', 'дек.'
];

export const RUSSIAN_WEEKDAYS_SHORT = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
export const RUSSIAN_WEEKDAYS_FULL = [
  'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'
];

export function formatDateToISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseISODate(isoString: string): Date {
  const [year, month, day] = isoString.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function formatRussianDate(isoString?: string | null, includeDayOfWeek = false): string {
  if (!isoString || !isoString.trim()) return '-';
  try {
    const cleanISO = isoString.slice(0, 10);
    if (!cleanISO || cleanISO.length < 10) return '-';
    const date = parseISODate(cleanISO);
    if (isNaN(date.getTime())) return '-';
    const day = date.getDate();
    const month = RUSSIAN_MONTHS_GENITIVE[date.getMonth()];
    if (!month) return '-';
    
    if (includeDayOfWeek) {
      const dayOfWeekIndex = (date.getDay() + 6) % 7;
      return `${RUSSIAN_WEEKDAYS_SHORT[dayOfWeekIndex]}, ${day} ${month}`;
    }
    return `${day} ${month}`;
  } catch {
    return '-';
  }
}

export function getWeekDays(referenceDate: Date): Date[] {
  // Monday as start of the week
  const date = new Date(referenceDate);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
  const monday = new Date(date.setDate(diff));
  
  const week: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const nextDay = new Date(monday);
    nextDay.setDate(monday.getDate() + i);
    week.push(nextDay);
  }
  return week;
}

export function getMonthMatrix(year: number, month: number): { date: Date; isCurrentMonth: boolean }[] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  
  // Starting day index (0: Monday, 6: Sunday)
  const startingDayIndex = (firstDay.getDay() + 6) % 7;
  
  const matrix: { date: Date; isCurrentMonth: boolean }[] = [];
  
  // Days from previous month
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  for (let i = startingDayIndex - 1; i >= 0; i--) {
    matrix.push({
      date: new Date(year, month - 1, prevMonthLastDay - i),
      isCurrentMonth: false,
    });
  }
  
  // Days of current month
  for (let i = 1; i <= lastDay.getDate(); i++) {
    matrix.push({
      date: new Date(year, month, i),
      isCurrentMonth: true,
    });
  }
  
  // Fill remaining slots to complete 35 or 42 grid cells
  const remaining = (7 - (matrix.length % 7)) % 7;
  for (let i = 1; i <= remaining; i++) {
    matrix.push({
      date: new Date(year, month + 1, i),
      isCurrentMonth: false,
    });
  }
  
  return matrix;
}

export interface ProductionTimelinePlan {
  scriptDateISO: string;
  shootingDateISO: string;
  editingDateISO: string;
  trialDateISO: string;
  mainFeedDateISO: string;
  scriptDateLabel: string;
  shootingDateLabel: string;
  editingDateLabel: string;
  trialDateLabel: string;
  mainFeedDateLabel: string;
}

export function getRecommendedProductionTimeline(baseDate = new Date()): ProductionTimelinePlan {
  const addDays = (d: Date, days: number) => {
    const res = new Date(d);
    res.setDate(res.getDate() + days);
    return res;
  };

  const scriptD = addDays(baseDate, 1);
  const shootD = addDays(baseDate, 2);
  const editD = addDays(baseDate, 3);
  const trialD = addDays(baseDate, 4);
  const mainD = addDays(baseDate, 6);

  return {
    scriptDateISO: formatDateToISO(scriptD),
    shootingDateISO: formatDateToISO(shootD),
    editingDateISO: formatDateToISO(editD),
    trialDateISO: formatDateToISO(trialD),
    mainFeedDateISO: formatDateToISO(mainD),
    scriptDateLabel: formatRussianDate(formatDateToISO(scriptD)),
    shootingDateLabel: formatRussianDate(formatDateToISO(shootD)),
    editingDateLabel: formatRussianDate(formatDateToISO(editD)),
    trialDateLabel: formatRussianDate(formatDateToISO(trialD)),
    mainFeedDateLabel: formatRussianDate(formatDateToISO(mainD)),
  };
}

export function validateDeadline(
  targetDueDateStr?: string | null,
  shootingDateStr?: string | null
): {
  isValid: boolean;
  reason?: string;
  suggestedDeadlineISO?: string;
  timeline?: ProductionTimelinePlan;
} {
  if (!targetDueDateStr || !targetDueDateStr.trim()) {
    return { isValid: true };
  }

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const targetDate = parseISODate(targetDueDateStr.slice(0, 10));
  targetDate.setHours(0, 0, 0, 0);

  const diffFromToday = Math.round((targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const timeline = getRecommendedProductionTimeline(now);

  // Minimum 5-6 days needed from today if starting fresh
  if (diffFromToday < 5) {
    return {
      isValid: false,
      reason: `Недостаточно времени для цикла производства. Выбран дедлайн ${diffFromToday <= 0 ? (diffFromToday === 0 ? 'на сегодня' : 'задним числом') : `через ${diffFromToday} дн.`}, а для качественного сценария, съёмок, монтажа и 48ч теста в пробных нужно минимум 5-6 дней запаса.`,
      suggestedDeadlineISO: timeline.mainFeedDateISO,
      timeline,
    };
  }

  // If shootingDate is set, deadline must be at least 3 days after shooting!
  if (shootingDateStr && shootingDateStr.trim()) {
    const shootDate = parseISODate(shootingDateStr.slice(0, 10));
    shootDate.setHours(0, 0, 0, 0);

    const diffFromShoot = Math.round((targetDate.getTime() - shootDate.getTime()) / (1000 * 60 * 60 * 24));
    if (diffFromShoot < 3) {
      const suggestedFromShoot = new Date(shootDate);
      suggestedFromShoot.setDate(suggestedFromShoot.getDate() + 3);
      const suggestedISO = formatDateToISO(suggestedFromShoot);

      return {
        isValid: false,
        reason: `Дедлайн готового ролика (${formatRussianDate(targetDueDateStr)}) не может стоять раньше или впритык к дате съёмки (${formatRussianDate(shootingDateStr)}). Нужно минимум 3 дня в запасе на монтаж и публикацию.`,
        suggestedDeadlineISO: suggestedISO,
        timeline,
      };
    }
  }

  return { isValid: true };
}

export function validateShootingDate(
  shootingDateStr?: string | null,
  targetDueDateStr?: string | null
): {
  isValid: boolean;
  reason?: string;
  suggestedDeadlineISO?: string;
} {
  if (!shootingDateStr || !shootingDateStr.trim()) {
    return { isValid: true };
  }

  const shootDate = parseISODate(shootingDateStr.slice(0, 10));
  shootDate.setHours(0, 0, 0, 0);

  if (targetDueDateStr && targetDueDateStr.trim()) {
    const targetDate = parseISODate(targetDueDateStr.slice(0, 10));
    targetDate.setHours(0, 0, 0, 0);

    const diffDays = Math.round((targetDate.getTime() - shootDate.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 3) {
      const suggestedTarget = new Date(shootDate);
      suggestedTarget.setDate(suggestedTarget.getDate() + 3);
      const suggestedDeadlineISO = formatDateToISO(suggestedTarget);

      return {
        isValid: false,
        reason: `Съёмка на ${formatRussianDate(shootingDateStr)} не укладывается в дедлайн готового ролика (${formatRussianDate(targetDueDateStr)}). Необходимо как минимум 3 дня в запасе для монтажа и проверки ролика.`,
        suggestedDeadlineISO,
      };
    }
  }

  return { isValid: true };
}


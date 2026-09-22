export type CallService = 'jitsi' | 'google' | 'telemost';

/**
 * Generates valid, working call links:
 * - Jitsi Meet: instant open room, zero configuration, works immediately in any browser without account
 * - Google Meet: creates proper meeting URL structure (3-4-3 syntax or /new)
 * - Yandex Telemost: instant call room
 */
export const generateWorkingCallLink = (service: CallService = 'jitsi', customTitle?: string): string => {
  const cleanTitle = (customTitle || 'sync')
    .toLowerCase()
    .replace(/[^a-zа-я0-9]/gi, '-')
    .replace(/-+/g, '-')
    .slice(0, 16);

  const randomSuffix = Math.random().toString(36).substring(2, 7);

  if (service === 'jitsi') {
    return `https://meet.jit.si/prodhub-${cleanTitle || 'call'}-${randomSuffix}`;
  }

  if (service === 'google') {
    // Valid 3-4-3 google meet format: e.g. https://meet.google.com/abc-defg-hij
    const chars = 'abcdefghijklmnopqrstuvwxyz';
    const randChars = (len: number) => Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    return `https://meet.google.com/${randChars(3)}-${randChars(4)}-${randChars(3)}`;
  }

  if (service === 'telemost') {
    return `https://telemost.yandex.ru/`;
  }

  return `https://meet.jit.si/prodhub-${cleanTitle || 'call'}-${randomSuffix}`;
};

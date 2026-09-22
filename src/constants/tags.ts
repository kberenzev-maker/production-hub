import { TagColor } from '../types';

export interface TagMeta {
  id: TagColor;
  label: string;
  icon: string;
  bg: string;
  text: string;
  border: string;
  badgeClass: string;
  dotColor: string;
}

export const TAG_DEFINITIONS: Record<TagColor, TagMeta> = {
  reels: {
    id: 'reels',
    label: 'Рилс',
    icon: '',
    bg: 'bg-black/[0.04]',
    text: 'text-black',
    border: 'border-transparent',
    badgeClass: 'bg-[#767680]/12 text-black',
    dotColor: '#007AFF',
  },
  carousel: {
    id: 'carousel',
    label: 'Карусель',
    icon: '',
    bg: 'bg-black/[0.04]',
    text: 'text-black',
    border: 'border-transparent',
    badgeClass: 'bg-[#767680]/12 text-black',
    dotColor: '#007AFF',
  },
  stories: {
    id: 'stories',
    label: 'Сторис',
    icon: '',
    bg: 'bg-black/[0.04]',
    text: 'text-black',
    border: 'border-transparent',
    badgeClass: 'bg-[#767680]/12 text-black',
    dotColor: '#FF9500',
  },
  test: {
    id: 'test',
    label: 'Пробный',
    icon: '',
    bg: 'bg-black/[0.04]',
    text: 'text-black',
    border: 'border-transparent',
    badgeClass: 'bg-[#767680]/12 text-black',
    dotColor: '#30B0C7',
  },
  shooting: {
    id: 'shooting',
    label: 'Съемка',
    icon: '',
    bg: 'bg-black/[0.04]',
    text: 'text-black',
    border: 'border-transparent',
    badgeClass: 'bg-[#767680]/12 text-black',
    dotColor: '#FF3B30',
  },
  idea: {
    id: 'idea',
    label: 'Идея',
    icon: '',
    bg: 'bg-black/[0.04]',
    text: 'text-black',
    border: 'border-transparent',
    badgeClass: 'bg-[#767680]/12 text-black',
    dotColor: '#8E8E93',
  },
  no_script: {
    id: 'no_script',
    label: 'Нет сценария',
    icon: '',
    bg: 'bg-black/[0.04]',
    text: 'text-black',
    border: 'border-transparent',
    badgeClass: 'bg-[#767680]/12 text-black',
    dotColor: '#FF9500',
  },
  editing: {
    id: 'editing',
    label: 'Монтаж',
    icon: '',
    bg: 'bg-black/[0.04]',
    text: 'text-black',
    border: 'border-transparent',
    badgeClass: 'bg-[#767680]/12 text-black',
    dotColor: '#007AFF',
  },
  design: {
    id: 'design',
    label: 'Дизайн',
    icon: '',
    bg: 'bg-black/[0.04]',
    text: 'text-black',
    border: 'border-transparent',
    badgeClass: 'bg-[#767680]/12 text-black',
    dotColor: '#8E8E93',
  },
  rest: {
    id: 'rest',
    label: 'Отдых',
    icon: '',
    bg: 'bg-black/[0.04]',
    text: 'text-black',
    border: 'border-transparent',
    badgeClass: 'bg-[#767680]/12 text-black',
    dotColor: '#34C759',
  },
};

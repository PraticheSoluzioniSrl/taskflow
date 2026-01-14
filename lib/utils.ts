import { format, isToday, isTomorrow, isYesterday, parseISO, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, addDays, isAfter, isBefore } from 'date-fns';
import { it } from 'date-fns/locale';

export function formatDate(date: string | Date, formatStr: string = 'dd MMM yyyy'): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, formatStr, { locale: it });
}

export function formatRelativeDate(date: string): string {
  const d = parseISO(date);
  if (isToday(d)) return 'Oggi';
  if (isTomorrow(d)) return 'Domani';
  if (isYesterday(d)) return 'Ieri';
  return formatDate(date, 'EEEE d MMMM');
}

export function getWeekDays(date: Date): Date[] {
  const start = startOfWeek(date, { weekStartsOn: 1 });
  const end = endOfWeek(date, { weekStartsOn: 1 });
  return eachDayOfInterval({ start, end });
}

export function getMonthDays(year: number, month: number): Date[] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDate = startOfWeek(firstDay, { weekStartsOn: 1 });
  const endDate = endOfWeek(lastDay, { weekStartsOn: 1 });
  return eachDayOfInterval({ start: startDate, end: endDate });
}

export function isOverdue(dateStr: string): boolean {
  const date = parseISO(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return isBefore(date, today);
}

export function isDueToday(dateStr: string): boolean {
  return isToday(parseISO(dateStr));
}

export function isDueSoon(dateStr: string, days: number = 3): boolean {
  const date = parseISO(dateStr);
  const today = new Date();
  const futureDate = addDays(today, days);
  return isAfter(date, today) && isBefore(date, futureDate);
}

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

export function getContrastColor(hexColor: string): string {
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#000000' : '#ffffff';
}

export function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

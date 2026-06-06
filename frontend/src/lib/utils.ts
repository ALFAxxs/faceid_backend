import { clsx, type ClassValue } from 'clsx';
import { format, parseISO } from 'date-fns';
import { uz } from 'date-fns/locale';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    return format(parseISO(iso), 'dd MMM yyyy HH:mm', { locale: uz });
  } catch {
    return '—';
  }
}

export function formatTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    return format(parseISO(iso), 'HH:mm', { locale: uz });
  } catch {
    return '—';
  }
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    return format(parseISO(iso), 'dd MMM yyyy', { locale: uz });
  } catch {
    return '—';
  }
}

export function minutesToHours(min: number | null | undefined): string {
  if (min == null) return '—';
  return (min / 60).toFixed(1);
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return parts.slice(0, 2).map((p) => p[0]?.toUpperCase() ?? '').join('');
}

// Bugungi sanani YYYY-MM-DD formatda (mahalliy vaqt bo'yicha)
export function todayStr(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

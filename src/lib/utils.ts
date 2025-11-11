import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function safeFormat(dateLike: unknown, fmt: string, fallback = '') {
  try {
    if (dateLike === null || typeof dateLike === 'undefined') return fallback;

    let date: Date | null = null;

    if (dateLike instanceof Date) {
      date = dateLike;
    } else if (typeof dateLike === 'string') {
      let normalized = dateLike.trim();
      if (!normalized) return fallback;

      // Convert "YYYY-MM-DD HH:mm:ss" to ISO-like format
      if (normalized.length > 10 && normalized[10] === ' ') {
        normalized = `${normalized.slice(0, 10)}T${normalized.slice(11)}`;
      }

      // Try parsing as ISO first, fallback to native Date
      date = parseISO(normalized);
      if (isNaN(date.getTime())) {
        date = new Date(normalized);
      }
    } else if (typeof dateLike === 'number') {
      date = new Date(dateLike);
    } else if (typeof dateLike === 'object') {
      const candidate = dateLike as Record<string, unknown>;
      if (candidate && typeof candidate.seconds === 'number') {
        date = new Date(candidate.seconds * 1000);
      } else if (candidate && typeof candidate.toDate === 'function') {
        date = candidate.toDate();
      }
    }

    if (!date || isNaN(date.getTime())) return fallback;

    return format(date, fmt);
  } catch (e) {
    return fallback;
  }
}

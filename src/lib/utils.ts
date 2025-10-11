import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function safeFormat(dateLike: any, fmt: string, fallback = '') {
  try {
    const d = new Date(dateLike);
    if (isNaN(d.getTime())) return fallback;
    // lazy import to avoid unused complaints
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const format = require('date-fns/format');
    return format(d, fmt);
  } catch (e) {
    return fallback;
  }
}

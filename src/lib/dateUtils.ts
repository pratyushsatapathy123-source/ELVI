/**
 * ELVI Date Utilities
 * Single source of truth for runtime dynamic dates, timezones, and calendar generation.
 * Default Timezone: Asia/Kolkata (UTC+5:30)
 */

export const DEFAULT_TIMEZONE = 'Asia/Kolkata';

export interface ZonedDateParts {
  year: number;
  month: number; // 1-12
  day: number; // 1-31
  weekday: string; // 'Monday', 'Tuesday', etc.
  weekdayShort: string; // 'Mon', 'Tue', etc.
  hours: number;
  minutes: number;
  seconds: number;
  isoDate: string; // 'YYYY-MM-DD'
  monthName: string; // 'October'
  monthShort: string; // 'Oct'
}

/**
 * Extracts accurate local calendar components for any Date in a specific timezone
 * without falling prey to UTC boundary shifts.
 */
export function getZonedDateParts(date: Date = new Date(), timeZone: string = DEFAULT_TIMEZONE): ZonedDateParts {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'long',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const map: Record<string, string> = {};
  for (const p of parts) {
    map[p.type] = p.value;
  }

  const year = parseInt(map.year, 10);
  const month = parseInt(map.month, 10);
  const day = parseInt(map.day, 10);
  const hours = parseInt(map.hour || '0', 10);
  const minutes = parseInt(map.minute || '0', 10);
  const seconds = parseInt(map.second || '0', 10);
  const weekday = map.weekday || '';
  const weekdayShort = weekday.slice(0, 3);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  const monthName = monthNames[month - 1] || '';
  const monthShort = monthName.slice(0, 3);
  const isoDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  return {
    year,
    month,
    day,
    weekday,
    weekdayShort,
    hours,
    minutes,
    seconds,
    isoDate,
    monthName,
    monthShort,
  };
}

/**
 * Returns today's ISO date string (YYYY-MM-DD) in the specified timezone (default Asia/Kolkata).
 */
export function getTodayIso(timeZone: string = DEFAULT_TIMEZONE): string {
  return getZonedDateParts(new Date(), timeZone).isoDate;
}

/**
 * Formats a given date or ISO string into a human-readable display string in the target timezone.
 * Example: "Saturday, October 24, 2026"
 */
export function formatFullDate(dateOrIso: string | Date = new Date(), timeZone: string = DEFAULT_TIMEZONE): string {
  const d = typeof dateOrIso === 'string' ? parseIsoToDate(dateOrIso) : dateOrIso;
  return new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(d);
}

/**
 * Formats date for section kickers.
 * Example: "SATURDAY, OCTOBER 24 · DAILY REFLECTION"
 */
export function formatDateKicker(
  dateOrIso: string | Date = new Date(),
  suffix = 'DAILY REFLECTION',
  timeZone: string = DEFAULT_TIMEZONE
): string {
  const d = typeof dateOrIso === 'string' ? parseIsoToDate(dateOrIso) : dateOrIso;
  const parts = getZonedDateParts(d, timeZone);
  return `${parts.weekday.toUpperCase()}, ${parts.monthName.toUpperCase()} ${parts.day} · ${suffix}`;
}

/**
 * Safely parse YYYY-MM-DD into a midday Date object to prevent UTC midnight date jumping.
 */
export function parseIsoToDate(isoDate: string): Date {
  const [y, m, d] = isoDate.split('-').map(Number);
  if (!y || !m || !d) return new Date();
  // Using noon local avoids any day-shift edge cases
  return new Date(y, m - 1, d, 12, 0, 0);
}

export interface DynamicCalendarDay {
  day: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isoDate: string;
}

/**
 * Generates a full 35 or 42 grid of days for any specified year and month (1-indexed month),
 * dynamically evaluating `isToday` against the current runtime date in the target timezone.
 */
export function generateMonthCalendar(
  year: number,
  month: number, // 1-12
  timeZone: string = DEFAULT_TIMEZONE
): DynamicCalendarDay[] {
  const todayIso = getTodayIso(timeZone);

  // First day of target month
  const firstDayOfMonth = new Date(year, month - 1, 1, 12, 0, 0);
  const dayOfWeek = firstDayOfMonth.getDay(); // 0 is Sunday, 1 is Monday...

  // Days in target month
  const daysInMonth = new Date(year, month, 0).getDate();

  // Days in previous month
  const daysInPrevMonth = new Date(year, month - 1, 0).getDate();

  const days: DynamicCalendarDay[] = [];

  // Previous month padding
  for (let i = dayOfWeek - 1; i >= 0; i--) {
    const d = daysInPrevMonth - i;
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    const isoDate = `${prevYear}-${String(prevMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    days.push({
      day: d,
      isCurrentMonth: false,
      isToday: isoDate === todayIso,
      isoDate,
    });
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const isoDate = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    days.push({
      day: d,
      isCurrentMonth: true,
      isToday: isoDate === todayIso,
      isoDate,
    });
  }

  // Next month padding to complete standard 35 or 42 cells
  const remaining = 35 - days.length > 0 ? 35 - days.length : (42 - days.length > 0 ? 42 - days.length : 0);
  for (let d = 1; d <= remaining; d++) {
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    const isoDate = `${nextYear}-${String(nextMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    days.push({
      day: d,
      isCurrentMonth: false,
      isToday: isoDate === todayIso,
      isoDate,
    });
  }

  return days;
}

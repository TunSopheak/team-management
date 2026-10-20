// Date helpers that work in the user's LOCAL time zone.
// (`new Date().toISOString()` is UTC, which puts "today" on the wrong day in Cambodia before 7am.)

const pad = (n: number) => String(n).padStart(2, '0');

/** Local calendar date as YYYY-MM-DD. */
export const toLocalDateString = (d: Date = new Date()) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const todayLocal = () => toLocalDateString();

/** Parse YYYY-MM-DD as local midnight (plain `new Date('2026-10-20')` is UTC midnight). */
export const parseLocalDate = (value: string) => {
  const [y, m, d] = value.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
};

/** Whole days from today until `value` (negative = overdue). */
export const daysUntil = (value: string) => {
  const today = parseLocalDate(todayLocal());
  return Math.round((parseLocalDate(value).getTime() - today.getTime()) / 86_400_000);
};

export const addDays = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return toLocalDateString(d);
};

/** "2026-10-19 · 09:30" in local time from an ISO timestamp. */
export const formatDateTime = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${toLocalDateString(d)} · ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

/** Local YYYY-MM-DD from an ISO timestamp. */
export const localDateOf = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso.slice(0, 10) : toLocalDateString(d);
};

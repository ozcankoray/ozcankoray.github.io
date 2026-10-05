import { t, type Lang } from '../i18n/ui';

const YM = /^(\d{4})-(0[1-9]|1[0-2])$/;

export function formatYearMonth(ym: string): string {
  const match = YM.exec(ym);
  if (!match) throw new Error(`Invalid year-month: "${ym}"`);
  return `${match[1]}.${match[2]}`;
}

export function formatPeriod(start: string, end: string | null, lang: Lang): string {
  const to = end === null ? t(lang, 'period.now') : formatYearMonth(end);
  return `${formatYearMonth(start)} → ${to}`;
}

export function formatDate(date: Date): string {
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(date.getUTCDate()).padStart(2, '0');
  return `${date.getUTCFullYear()}.${mm}.${dd}`;
}

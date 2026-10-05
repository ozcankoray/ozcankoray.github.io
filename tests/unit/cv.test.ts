import { describe, it, expect } from 'vitest';
import { education, experience, languages, programs, KIND_LABEL } from '../../src/data/cv';
import { profile } from '../../src/data/profile';
import { formatDate, formatPeriod, formatYearMonth } from '../../src/lib/format';

const YM = /^\d{4}-(0[1-9]|1[0-2])$/;

const isLocalized = (v: unknown): v is { tr: unknown; en: unknown } =>
  typeof v === 'object' && v !== null && 'tr' in v && 'en' in v;

const collectLocalized = (v: unknown): ReadonlyArray<{ tr: unknown; en: unknown }> =>
  isLocalized(v)
    ? [v]
    : Array.isArray(v)
      ? v.flatMap(collectLocalized)
      : typeof v === 'object' && v !== null
        ? Object.values(v).flatMap(collectLocalized)
        : [];

describe('cv data', () => {
  it('every localized string is non-empty in both languages', () => {
    const all = collectLocalized({ experience, education, programs, languages, KIND_LABEL, profile });
    expect(all.length).toBeGreaterThan(20);
    for (const item of all) {
      expect(typeof item.tr === 'string' && item.tr.trim().length > 0, JSON.stringify(item)).toBe(true);
      expect(typeof item.en === 'string' && item.en.trim().length > 0, JSON.stringify(item)).toBe(true);
    }
  });

  it('experience dates are valid, ordered newest first, and end after start', () => {
    for (const x of experience) {
      expect(x.start).toMatch(YM);
      if (x.end !== null) {
        expect(x.end).toMatch(YM);
        expect(x.end >= x.start, x.id).toBe(true);
      }
    }
    const starts = experience.map((x) => x.start);
    expect(starts).toEqual([...starts].sort().reverse());
  });

  it('the current role is first and is Sompo Sigorta', () => {
    expect(experience[0]?.end).toBeNull();
    expect(experience[0]?.company).toBe('Sompo Sigorta');
    expect(experience.filter((x) => x.end === null)).toHaveLength(1);
  });

  it('ids are unique', () => {
    const ids = experience.map((x) => x.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('format', () => {
  it('formats year-month', () => {
    expect(formatYearMonth('2026-08')).toBe('2026.08');
  });

  it('formats open and closed periods per language', () => {
    expect(formatPeriod('2026-08', null, 'tr')).toBe('2026.08 → şimdi');
    expect(formatPeriod('2026-08', null, 'en')).toBe('2026.08 → now');
    expect(formatPeriod('2025-04', '2025-08', 'en')).toBe('2025.04 → 2025.08');
  });

  it('formats dates in UTC', () => {
    expect(formatDate(new Date('2026-10-05T23:30:00Z'))).toBe('2026.10.05');
  });

  it('rejects malformed year-month', () => {
    expect(() => formatYearMonth('2026-13')).toThrow();
  });
});

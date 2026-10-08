import { createHash } from 'node:crypto';

export interface HashedSecrets {
  readonly digits: readonly string[];
  readonly words: readonly string[];
}

// SHA-256 of the private phone number (digits only) and district (folded). Hashes only, never the values.
export const SECRETS: HashedSecrets = {
  digits: ['c2e6da10eaa0b4df8e4943cce72bda41969e65c265f9ad045075b78ea1c59250'],
  words: ['50a46960be7e6078769cf41fdcff18becda376d91a22d26f1e2b4b18dd2d98fd'],
};

const MIN_DIGITS = 7;
const MAX_DIGITS = 15;

export const sha256 = (value: string): string => createHash('sha256').update(value).digest('hex');

export const fold = (text: string): string =>
  text
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/ı/g, 'i')
    .toLowerCase();

const digitRuns = (text: string): readonly string[] =>
  (text.match(/[\d(+][\d\s().+-]*/g) ?? []).map((run) => run.replace(/\D/g, ''));

const windows = (digits: string): readonly string[] =>
  Array.from({ length: MAX_DIGITS - MIN_DIGITS + 1 }, (_, i) => i + MIN_DIGITS).flatMap((size) =>
    Array.from({ length: Math.max(0, digits.length - size + 1) }, (_, start) => digits.slice(start, start + size)),
  );

export const containsHashed = (text: string, secrets: HashedSecrets): boolean => {
  const digitHit = digitRuns(text)
    .flatMap(windows)
    .some((w) => secrets.digits.includes(sha256(w)));
  const wordHit = (fold(text).match(/\p{L}+/gu) ?? []).some((w) => secrets.words.includes(sha256(w)));
  return digitHit || wordHit;
};

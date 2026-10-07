import { describe, it, expect } from 'vitest';
import { containsHashed, type HashedSecrets } from '../forbidden';

// Hashes of the stand-ins "1234567890" and "testville" — never real data.
const FAKE: HashedSecrets = {
  digits: ['c775e7b757ede630cd0aa1113bd102661ab38829ca52a6422ab782862f268646'],
  words: ['7a1ca31106c2f8d865b48d1d39c89921a4212dae78df3b8856f93b4bbbdf040f'],
};

describe('containsHashed', () => {
  it.each([
    '1234567890',
    'call 0123-456-78-90 now',
    '(123) 456 78 90',
    '+90 123.456.7890',
    '<a href="tel:+901234567890">x</a>',
  ])('finds the number in %s', (text) => {
    expect(containsHashed(text, FAKE)).toBe(true);
  });

  it.each(['Testville', 'lives in TESTVILLE, somewhere', 'testville/'])('finds the word in %s', (text) => {
    expect(containsHashed(text, FAKE)).toBe(true);
  });

  it.each(['123456789', 'testvilles', 'korayozcan33@gmail.com', '2026.08 → 2026.10'])('ignores %s', (text) => {
    expect(containsHashed(text, FAKE)).toBe(false);
  });
});

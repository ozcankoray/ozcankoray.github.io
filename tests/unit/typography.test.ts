import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { walk } from '../walk';

const TEXT = /\.(astro|ts|mjs|js|md|mdx|css|json|txt|svg|html|xml)$/;
const EM_DASH = /—|&mdash;|&#8212;|\u2014/i;

describe('typography', () => {
  it('has no em dash in publishable sources', () => {
    const files = ['src', 'public', 'github'].flatMap(walk).filter((f) => TEXT.test(f));
    expect(files.length).toBeGreaterThan(0);
    const offenders = files.filter((file) => EM_DASH.test(readFileSync(file, 'utf8')));
    expect(offenders).toEqual([]);
  });
});

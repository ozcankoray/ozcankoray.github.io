import { describe, it, expect } from 'vitest';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { containsHashed, SECRETS } from '../forbidden';

const TEXT = /\.(astro|ts|mjs|js|md|mdx|css|json|txt|svg|html|xml)$/;

const walk = (dir: string): readonly string[] =>
  existsSync(dir)
    ? readdirSync(dir, { withFileTypes: true }).flatMap((d) =>
        d.isDirectory() ? walk(join(dir, d.name)) : [join(dir, d.name)],
      )
    : [];

describe('privacy', () => {
  it('no phone number or home address in publishable sources', () => {
    const files = ['src', 'public', 'github'].flatMap(walk).filter((f) => TEXT.test(f));
    expect(files.length).toBeGreaterThan(0);
    for (const file of files) {
      expect(containsHashed(readFileSync(file, 'utf8'), SECRETS), file).toBe(false);
    }
  });
});

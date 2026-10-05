import { describe, it, expect } from 'vitest';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const FORBIDDEN = [/0000000000/, /506\s*102\s*77\s*57/, /REDACTED/i];
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
      const text = readFileSync(file, 'utf8');
      for (const pattern of FORBIDDEN) expect(pattern.test(text), `${pattern} in ${file}`).toBe(false);
    }
  });
});

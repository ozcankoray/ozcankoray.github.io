import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

export const walk = (dir: string): readonly string[] =>
  existsSync(dir)
    ? readdirSync(dir, { withFileTypes: true }).flatMap((d) =>
        d.isDirectory() ? walk(join(dir, d.name)) : [join(dir, d.name)],
      )
    : [];

import { describe, it, expect } from 'vitest';
import { experience, skills } from '../../src/data/cv';

describe('cv skills', () => {
  it('list the tools named in the current role', () => {
    const current = experience.find((x) => x.end === null);
    const lower = skills.map((s) => s.toLowerCase());
    expect(current).toBeDefined();
    for (const tag of current?.tags.filter((t) => t !== 'test automation') ?? []) expect(lower, tag).toContain(tag);
  });
});

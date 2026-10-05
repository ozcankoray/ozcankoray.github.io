import { describe, it, expect } from 'vitest';
import { personJsonLd } from '../../src/lib/jsonld';

describe('personJsonLd', () => {
  it('describes the person with profile links and no address', () => {
    const data: Record<string, unknown> = JSON.parse(personJsonLd('en'));
    expect(data['@type']).toBe('Person');
    expect(data.name).toBe('Koray Özcan');
    expect(data.jobTitle).toBe('Computer Engineer');
    expect(data.sameAs).toEqual(['https://github.com/ozcankoray', 'https://www.linkedin.com/in/koray%C3%B6zcan/']);
    expect(data).not.toHaveProperty('address');
    expect(data).not.toHaveProperty('telephone');
  });

  it('cannot break out of a script tag', () => {
    expect(personJsonLd('tr')).not.toContain('<');
  });
});

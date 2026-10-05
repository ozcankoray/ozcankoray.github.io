import { describe, it, expect } from 'vitest';
import { buildOgSvg, renderOg } from '../../src/lib/og';

const input = { kicker: 'korayozcan.me', title: 'Gıda Enflasyonu Takibi', subtitle: 'İstanbul · ğüşıöç' };

describe('og images', () => {
  it('renders a 1200x630 PNG', async () => {
    const png = await renderOg(input);
    expect(Buffer.from(png.subarray(1, 4)).toString()).toBe('PNG');
    const view = new DataView(png.buffer, png.byteOffset, png.byteLength);
    expect(view.getUint32(16)).toBe(1200);
    expect(view.getUint32(20)).toBe(630);
  }, 20_000);

  it.each(['ğ', 'ş', 'İ', 'ı'])('renders the Turkish glyph %s with a real outline', async (glyph) => {
    const real = await buildOgSvg({ ...input, title: glyph, subtitle: 'x' });
    const missing = await buildOgSvg({ ...input, title: '\u{F0000}', subtitle: 'x' });
    expect(real).not.toEqual(missing);
  }, 20_000);
});

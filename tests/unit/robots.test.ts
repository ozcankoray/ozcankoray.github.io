import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

const AI_BOTS = [
  'GPTBot',
  'OAI-SearchBot',
  'ChatGPT-User',
  'ClaudeBot',
  'Claude-User',
  'Claude-SearchBot',
  'anthropic-ai',
  'PerplexityBot',
  'Perplexity-User',
  'Google-Extended',
  'Applebot-Extended',
  'CCBot',
  'Meta-ExternalAgent',
  'Amazonbot',
];

const groups = (text: string): ReadonlyMap<string, readonly string[]> => {
  const result = new Map<string, string[]>();
  let agents: string[] = [];
  let lastWasAgent = false;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    const [key, ...rest] = line.split(':');
    const value = rest.join(':').trim();
    if (key?.toLowerCase() === 'user-agent') {
      agents = lastWasAgent ? [...agents, value] : [value];
      lastWasAgent = true;
      for (const agent of agents) if (!result.has(agent)) result.set(agent, []);
    } else if (line !== '' && !line.startsWith('#')) {
      lastWasAgent = false;
      for (const agent of agents) result.get(agent)?.push(`${key?.toLowerCase()}:${value}`);
    }
  }
  return result;
};

describe('robots.txt', () => {
  const text = readFileSync('public/robots.txt', 'utf8');
  const parsed = groups(text);

  it('explicitly allows every AI crawler and blocks nothing', () => {
    for (const bot of AI_BOTS) {
      expect(parsed.get(bot), bot).toContain('allow:/');
      expect(parsed.get(bot)?.some((rule) => rule.startsWith('disallow:') && rule !== 'disallow:'), bot).toBe(false);
    }
  });

  it('keeps the wildcard group open and points to the sitemap', () => {
    expect(parsed.get('*')).toContain('allow:/');
    expect(text).toContain('Sitemap: https://korayozcan.me/sitemap-index.xml');
  });
});

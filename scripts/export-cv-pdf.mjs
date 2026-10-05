import { preview } from 'astro';
import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

const PORT = 4322;
const TARGETS = [
  { lang: 'tr', path: '/cv/' },
  { lang: 'en', path: '/en/cv/' },
];

await mkdir('public/cv', { recursive: true });
const server = await preview({ root: '.', server: { port: PORT } });
const browser = await chromium.launch();

try {
  const page = await browser.newPage();
  for (const { lang, path } of TARGETS) {
    const res = await page.goto(`http://localhost:${PORT}${path}`, { waitUntil: 'networkidle' });
    if (!res?.ok()) throw new Error(`${path} returned ${res?.status()}`);
    await page.emulateMedia({ media: 'print' });
    const out = `public/cv/koray-ozcan-cv-${lang}.pdf`;
    await page.pdf({
      path: out,
      format: 'A4',
      printBackground: false,
      margin: { top: '14mm', bottom: '14mm', left: '16mm', right: '16mm' },
    });
    process.stdout.write(`wrote ${out}\n`);
  }
} finally {
  await browser.close();
  await server.stop();
}

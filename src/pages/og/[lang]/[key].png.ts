import type { APIRoute } from 'astro';
import { ogEntries, type OgEntry } from '../../../lib/og-entries';
import { renderOg } from '../../../lib/og';

export async function getStaticPaths() {
  const entries = await ogEntries();
  return entries.map((entry) => ({ params: { lang: entry.lang, key: entry.key }, props: { entry } }));
}

export const GET: APIRoute = async ({ props }) => {
  const { entry } = props as { readonly entry: OgEntry };
  return new Response(await renderOg(entry), { headers: { 'Content-Type': 'image/png' } });
};

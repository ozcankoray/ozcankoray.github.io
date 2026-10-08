import type { APIRoute } from 'astro';
import { llmsProjects } from '../lib/llms-content';
import { buildLlmsFull } from '../lib/llms';

export const GET: APIRoute = async () =>
  new Response(buildLlmsFull(await llmsProjects()), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });

import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export interface OgInput {
  readonly title: string;
  readonly subtitle: string;
  readonly kicker: string;
}

type SatoriFont = Parameters<typeof satori>[1]['fonts'][number];

interface OgNode {
  readonly type: 'div';
  readonly props: {
    readonly style: Readonly<Record<string, string | number>>;
    readonly children?: string | OgNode | readonly OgNode[];
  };
}

const font = (pkg: string, file: string): Buffer =>
  readFileSync(join(process.cwd(), 'node_modules', '@fontsource', pkg, 'files', file));

const loadFonts = (): readonly SatoriFont[] => [
  { name: 'Inter', data: font('inter', 'inter-latin-800-normal.woff'), weight: 800, style: 'normal' },
  { name: 'Inter Ext', data: font('inter', 'inter-latin-ext-800-normal.woff'), weight: 800, style: 'normal' },
  { name: 'Inter', data: font('inter', 'inter-latin-400-normal.woff'), weight: 400, style: 'normal' },
  { name: 'Inter Ext', data: font('inter', 'inter-latin-ext-400-normal.woff'), weight: 400, style: 'normal' },
  { name: 'Mono', data: font('jetbrains-mono', 'jetbrains-mono-latin-400-normal.woff'), weight: 400, style: 'normal' },
  { name: 'Mono Ext', data: font('jetbrains-mono', 'jetbrains-mono-latin-ext-400-normal.woff'), weight: 400, style: 'normal' },
];

const fonts = ((): (() => readonly SatoriFont[]) => {
  let cache: readonly SatoriFont[] | undefined;
  return () => (cache ??= loadFonts());
})();

const div = (style: OgNode['props']['style'], children?: OgNode['props']['children']): OgNode => ({
  type: 'div',
  props: { style, children },
});

function tree({ title, subtitle, kicker }: OgInput): OgNode {
  return div(
    { width: '100%', height: '100%', display: 'flex', background: '#0e0f0f', fontFamily: 'Inter, "Inter Ext"' },
    [
      div({ width: 12, height: '100%', background: '#c6f432' }),
      div({ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '72px 80px', flex: 1 }, [
        div({ fontFamily: 'Mono, "Mono Ext"', fontSize: 28, color: '#c6f432' }, kicker),
        div({ display: 'flex', flexDirection: 'column' }, [
          div({ fontSize: 76, fontWeight: 800, color: '#f2f4f2', letterSpacing: -2, lineHeight: 1.05 }, title),
          div({ marginTop: 24, fontSize: 32, fontWeight: 400, color: '#8a8f8a', lineHeight: 1.35 }, subtitle),
        ]),
        div({ fontFamily: 'Mono, "Mono Ext"', fontSize: 24, color: '#7a7f7a' }, 'Koray Özcan · computer_engineer'),
      ]),
    ],
  );
}

export async function buildOgSvg(input: OgInput): Promise<string> {
  // satori accepts plain {type, props} objects; its signature is typed for React elements.
  const element = tree(input) as unknown as Parameters<typeof satori>[0];
  return satori(element, { width: 1200, height: 630, fonts: [...fonts()] });
}

export async function renderOg(input: OgInput): Promise<Uint8Array<ArrayBuffer>> {
  const svg = await buildOgSvg(input);
  return new Uint8Array(new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } }).render().asPng());
}

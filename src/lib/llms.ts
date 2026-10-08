import { education, experience, KIND_LABEL, languages, programs, skills, type Experience } from '../data/cv';
import { profile } from '../data/profile';
import { cvPdfPath, localizedPath, type Route } from '../i18n/routes';
import { LANGS, t, type Lang } from '../i18n/ui';
import { formatPeriod } from './format';

export interface ProjectDoc {
  readonly lang: Lang;
  readonly slug: string;
  readonly title: string;
  readonly summary: string;
  readonly year: number;
  readonly stack: readonly string[];
  readonly body: string;
}

const NAME: Readonly<Record<Lang, string>> = { en: 'English', tr: 'Türkçe' };

const abs = (path: string): string => new URL(path, profile.site).toString();
const link = (label: string, path: string, note?: string): string =>
  `- [${label}](${abs(path)})${note === undefined ? '' : `: ${note}`}`;
const pageRoute = (route: Route, lang: Lang): string => localizedPath(lang, route);

const pageLinks = (): readonly string[] =>
  LANGS.flatMap((lang) => [
    link(`Home (${NAME[lang]})`, pageRoute({ name: 'home' }, lang), profile.intro[lang]),
    link(`CV (${NAME[lang]})`, pageRoute({ name: 'cv' }, lang)),
    link(`CV PDF (${NAME[lang]})`, cvPdfPath(lang)),
  ]);

const projectLinks = (projects: readonly ProjectDoc[]): readonly string[] =>
  projects.map((p) =>
    link(`${p.title} (${NAME[p.lang]})`, pageRoute({ name: 'project', slug: p.slug }, p.lang), p.summary),
  );

export function buildLlmsIndex(projects: readonly ProjectDoc[]): string {
  return [
    `# ${profile.name}`,
    '',
    `> ${profile.intro.en}`,
    '',
    'Computer engineer in Istanbul. This site is available in English and Turkish; every page has a counterpart in the other language.',
    '',
    '## Pages',
    ...pageLinks(),
    '',
    '## Projects',
    ...projectLinks(projects),
    '',
    '## Contact',
    `- Email: ${profile.email}`,
    `- GitHub: ${profile.github}`,
    `- LinkedIn: ${profile.linkedin}`,
    '',
    '## Optional',
    link('Full text of this site', '/llms-full.txt', 'CV, about text and project case studies in both languages'),
    '',
  ].join('\n');
}

const jobBlock = (x: Experience, lang: Lang): readonly string[] => [
  `#### ${x.role[lang]}, ${x.company} (${formatPeriod(x.start, x.end, lang)}, ${KIND_LABEL[x.kind][lang]})`,
  ...x.bullets.map((b) => `- ${b[lang]}`),
  '',
];

const educationLines = (lang: Lang): readonly string[] =>
  education.map((e) => `- ${e.degree[lang]}, ${e.school[lang]} (${e.start}–${e.end}), GPA ${e.gpa}`);

const projectBlock = (p: ProjectDoc): readonly string[] => [
  `#### ${p.title} (${p.year})`,
  p.summary,
  `Stack: ${p.stack.join(', ')}`,
  '',
  p.body.trim(),
  '',
];

const languageSection = (lang: Lang, projects: readonly ProjectDoc[]): readonly string[] => [
  `## ${NAME[lang]}`,
  '',
  `### ${t(lang, 'nav.about')}`,
  ...profile.about.flatMap((paragraph) => [paragraph[lang], '']),
  `### ${t(lang, 'cv.experience')}`,
  ...experience.flatMap((x) => jobBlock(x, lang)),
  `### ${t(lang, 'cv.education')}`,
  ...educationLines(lang),
  ...programs.map((p) => `- ${p[lang]}`),
  '',
  `### ${t(lang, 'cv.skills')}`,
  skills.join(', '),
  '',
  `### ${t(lang, 'cv.languages')}`,
  ...languages.map((l) => `- ${l.name[lang]}: ${l.level[lang]}`),
  '',
  '### Projects',
  ...projects.filter((p) => p.lang === lang).flatMap(projectBlock),
];

export function buildLlmsFull(projects: readonly ProjectDoc[]): string {
  return [
    `# ${profile.name}: full content`,
    '',
    `Source: ${profile.site}/ (English and Turkish). Short index: ${abs('/llms.txt')}`,
    '',
    ...LANGS.flatMap((lang) => languageSection(lang, projects)),
  ].join('\n');
}

export const LANGS = ['tr', 'en'] as const;
export type Lang = (typeof LANGS)[number];

export const OTHER: Readonly<Record<Lang, Lang>> = { tr: 'en', en: 'tr' };
export const OG_LOCALE: Readonly<Record<Lang, string>> = { tr: 'tr_TR', en: 'en_US' };

const tr = {
  role: 'Bilgisayar Mühendisi',
  skip: 'İçeriğe geç',
  'nav.label': 'Bölümler',
  'nav.about': 'hakkında',
  'nav.experience': 'deneyim',
  'nav.internships': 'stajlar',
  'nav.projects': 'projeler',
  'nav.apps': 'mobil uygulamalar',
  'nav.writing': 'yazılar',
  'links.email': 'E-posta',
  'lang.label': 'Dil',
  'lang.switch': 'English version',
  'theme.toggle': 'Temayı değiştir',
  'cv.title': 'Özgeçmiş',
  'cv.description': 'Koray Özcan’ın deneyimi, eğitimi ve yetkinlikleri.',
  'cv.full': '→ tam özgeçmiş',
  'cv.download': 'CV.pdf ↓',
  'cv.print': 'Yazdır',
  'cv.experience': 'deneyim',
  'cv.internships': 'stajlar',
  'cv.education': 'eğitim',
  'cv.programs': 'program ve seminerler',
  'cv.skills': 'yetkinlikler',
  'cv.languages': 'diller',
  'period.now': 'şimdi',
  'project.live': 'YAYINDA · APP STORE',
  'project.back': '← tüm projeler',
  'project.architecture': 'mimari',
  'project.links': 'bağlantılar',
  'project.private': 'Kaynak kod özel.',
  'writing.title': 'Yazılar',
  'writing.description': 'Yazılım, veri ve finans üzerine notlar.',
  'writing.empty': 'Henüz yazı yok.',
  'writing.all': '→ tüm yazılar',
  'writing.back': '← tüm yazılar',
} as const;

export type UiKey = keyof typeof tr;

const en: Readonly<Record<UiKey, string>> = {
  role: 'Computer Engineer',
  skip: 'Skip to content',
  'nav.label': 'Sections',
  'nav.about': 'about',
  'nav.experience': 'experience',
  'nav.internships': 'internships',
  'nav.projects': 'projects',
  'nav.apps': 'mobile apps',
  'nav.writing': 'writing',
  'links.email': 'Email',
  'lang.label': 'Language',
  'lang.switch': 'Türkçe sürüm',
  'theme.toggle': 'Toggle theme',
  'cv.title': 'Résumé',
  'cv.description': 'Experience, education and skills of Koray Özcan.',
  'cv.full': '→ full résumé',
  'cv.download': 'CV.pdf ↓',
  'cv.print': 'Print',
  'cv.experience': 'experience',
  'cv.internships': 'internships',
  'cv.education': 'education',
  'cv.programs': 'programs & seminars',
  'cv.skills': 'skills',
  'cv.languages': 'languages',
  'period.now': 'now',
  'project.live': 'LIVE · APP STORE',
  'project.back': '← all projects',
  'project.architecture': 'architecture',
  'project.links': 'links',
  'project.private': 'Source code is private.',
  'writing.title': 'Writing',
  'writing.description': 'Notes on software, data and finance.',
  'writing.empty': 'No posts yet.',
  'writing.all': '→ all posts',
  'writing.back': '← all posts',
};

export const ui: Readonly<Record<Lang, Readonly<Record<UiKey, string>>>> = { tr, en };

export function t(lang: Lang, key: UiKey): string {
  return ui[lang][key];
}

import { LANGS, type Lang } from '../i18n/ui';

const isLang = (value: string): value is Lang => (LANGS as readonly string[]).includes(value);

export function entryLang(id: string): Lang {
  const [head, ...rest] = id.split('/');
  if (head === undefined || rest.length === 0 || !isLang(head)) {
    throw new Error(`Content entry "${id}" must live in a tr/ or en/ folder`);
  }
  return head;
}

export function entrySlug(id: string): string {
  entryLang(id);
  return id.split('/').slice(1).join('/');
}

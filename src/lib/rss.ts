import rss from '@astrojs/rss';
import { getPosts } from './content';
import { entrySlug } from './entries';
import { profile } from '../data/profile';
import { localizedPath } from '../i18n/routes';
import { t, type Lang } from '../i18n/ui';

export async function feed(lang: Lang, site: URL | undefined): Promise<Response> {
  const posts = await getPosts(lang);
  return rss({
    title: `${profile.name} | ${t(lang, 'writing.title')}`,
    description: t(lang, 'writing.description'),
    site: site ?? profile.site,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.date,
      link: localizedPath(lang, { name: 'post', slug: entrySlug(post.id) }),
    })),
    customData: `<language>${lang}</language>`,
  });
}

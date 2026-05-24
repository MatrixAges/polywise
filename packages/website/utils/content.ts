import { default_locale } from '@website/app.config'

import type { Locales } from '@website/app.config'

const content_files = import.meta.glob('../content/**/*.mdx', {
	query: '?raw',
	import: 'default',
	eager: true
}) as Record<string, string>

const resolveContentKey = (section: string, slug: string, locale: string) => {
	return `../content/${section}/${slug}/${locale}.mdx`
}

export const getContent = (section: string, slug: string, locale: Locales) => {
	return (
		content_files[resolveContentKey(section, slug, locale)] ??
		content_files[resolveContentKey(section, slug, default_locale)]
	)
}

export const getContentList = (section: string, slugs: Array<string>, locale: Locales) => {
	return slugs.map(slug => getContent(section, slug, locale)).filter(Boolean) as Array<string>
}

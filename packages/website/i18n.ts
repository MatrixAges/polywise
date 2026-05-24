import { getRequestConfig } from 'next-intl/server'

import { getUserLocale } from './services'

export default getRequestConfig(async () => {
	const { locale } = await getUserLocale()

	return {
		locale,
		messages: {
			common: (await import(`./locales/common/index.json`)).default,
			global: (await import(`./locales/${locale}/global.json`)).default,
			layout: (await import(`./locales/${locale}/layout.json`)).default,
			index: (await import(`./locales/${locale}/index.json`)).default,
			price: (await import(`./locales/${locale}/price.json`)).default,
			brand: (await import(`./locales/${locale}/brand.json`)).default,
			gtd: (await import(`./locales/${locale}/gtd.json`)).default,
			blog: (await import(`./locales/${locale}/blog.json`)).default,
			download: (await import(`./locales/${locale}/download.json`)).default,
			contact: (await import(`./locales/${locale}/contact.json`)).default,
			features: (await import(`./locales/${locale}/features.json`)).default,
			docs: (await import(`./locales/${locale}/docs.json`)).default,
			doc: (await import(`./locales/${locale}/doc.json`)).default
		}
	}
})

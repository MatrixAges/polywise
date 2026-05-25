import { getRequestConfig } from 'next-intl/server'
import { cookies } from 'next/headers'

import { default_locale, LOCALE, locales } from './app.config'

import type { Locales } from './app.config'

const isLocale = (value: string | undefined): value is Locales => {
	return locales.includes(value as Locales)
}

export default getRequestConfig(async ({ locale, requestLocale }) => {
	const request_locale = locale ?? (await requestLocale)
	const cookie_locale = (await cookies()).get(LOCALE)?.value
	const current_locale = isLocale(request_locale)
		? request_locale
		: isLocale(cookie_locale)
			? cookie_locale
			: default_locale

	return {
		locale: current_locale,
		messages: {
			common: (await import(`./locales/common/index.json`)).default,
			global: (await import(`./locales/${current_locale}/global.json`)).default,
			layout: (await import(`./locales/${current_locale}/layout.json`)).default,
			index: (await import(`./locales/${current_locale}/index.json`)).default,
			blog: (await import(`./locales/${current_locale}/blog.json`)).default,
			download: (await import(`./locales/${current_locale}/download.json`)).default,
			contact: (await import(`./locales/${current_locale}/contact.json`)).default,
			docs: (await import(`./locales/${current_locale}/docs.json`)).default,
			doc: (await import(`./locales/${current_locale}/doc.json`)).default
		}
	}
})

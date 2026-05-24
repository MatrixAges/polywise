import { hasLocale } from 'next-intl'
import { getRequestConfig } from 'next-intl/server'

import { routing } from './routing'

const localeFiles = import.meta.glob('../locales/*/*.json', {
	import: 'default',
	eager: true
}) as Record<string, Record<string, unknown>>

const namespaces = [
	'common',
	'global',
	'layout',
	'index',
	'price',
	'brand',
	'gtd',
	'blog',
	'download',
	'contact',
	'features',
	'docs',
	'doc'
] as const

export default getRequestConfig(async ({ requestLocale }) => {
	const requested = await requestLocale
	const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale

	const messages = Object.fromEntries(
		namespaces.map(namespace => {
			const key =
				namespace === 'common'
					? '../locales/common/index.json'
					: `../locales/${locale}/${namespace}.json`

			return [namespace, localeFiles[key] ?? {}]
		})
	)

	return { locale, messages }
})

import { default_locale } from '@website/app.config'
import { base_url } from '@website/utils/const'
import { requestWeb } from '@website/utils/ofetch'
import { headers } from 'next/headers'

import type { Locales } from '@website/app.config'

const resolveContentPath = (section: string, slug: string, locale: string) => {
	return `/content/${section}/${slug}/${locale}.mdx`
}

const resolveOrigin = async () => {
	if (base_url) {
		return base_url
	}

	const requestHeaders = await headers()
	const host = requestHeaders.get('x-forwarded-host') ?? requestHeaders.get('host')

	if (host) {
		const protocol = requestHeaders.get('x-forwarded-proto') ?? (host.includes('localhost') ? 'http' : 'https')

		return `${protocol}://${host}`
	}

	return `http://localhost:${process.env.PORT ?? '3000'}`
}

const requestContent = async (contentPath: string) => {
	const origin = await resolveOrigin()

	return requestWeb<string>(`${origin}${contentPath}`, {
		parseResponse: txt => txt,
		cache: 'no-store',
		retry: 0
	})
}

const is404 = (error: unknown) => {
	return typeof error === 'object' && error !== null && (error as any).response?.status === 404
}

export const getContent = async (section: string, slug: string, locale: Locales) => {
	try {
		return await requestContent(resolveContentPath(section, slug, locale))
	} catch (error) {
		if (!is404(error) || locale === default_locale) {
			if (is404(error)) {
				return null
			}

			throw error
		}
	}

	try {
		return await requestContent(resolveContentPath(section, slug, default_locale))
	} catch (error) {
		if (is404(error)) {
			return null
		}

		throw error
	}
}

export const getContentList = async (section: string, slugs: Array<string>, locale: Locales) => {
	const list = await Promise.all(slugs.map(slug => getContent(section, slug, locale)))

	return list.filter(Boolean) as Array<string>
}

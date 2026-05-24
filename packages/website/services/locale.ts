'use server'

import { default_locale, LOCALE } from '@website/app.config'
import { getLocale } from 'next-intl/server'
import { cookies } from 'next/headers'

import type { Locales } from '@website/app.config'

interface ResGetUserLocale {
	locale: Locales
	cookie: boolean
}

export const getUserLocale = async () => {
	const locale = (await getLocale().catch(() => default_locale)) as Locales
	const cookie_locale = (await cookies()).get(LOCALE)?.value as Locales | undefined

	return {
		locale,
		cookie: cookie_locale === locale
	} as ResGetUserLocale
}

export const setUserLocale = async (locale: Locales) => {
	const now = new Date()

	;(await cookies()).set(LOCALE, locale, { expires: now.setFullYear(now.getFullYear() + 3) })
}

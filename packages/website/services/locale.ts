'use server'

import { default_locale, LOCALE, locales } from '@website/app.config'
import { cookies } from 'next/headers'

import type { Locales } from '@website/app.config'

interface ResGetUserLocale {
	locale: Locales
	cookie: boolean
}

const isLocale = (value: string | undefined): value is Locales => {
	return locales.includes(value as Locales)
}

const resolveLocale = (value: string | undefined): Locales => {
	return isLocale(value) ? value : default_locale
}

export const getUserLocale = async () => {
	const cookie_locale = (await cookies()).get(LOCALE)?.value
	const locale = resolveLocale(cookie_locale)

	return {
		locale,
		cookie: cookie_locale === locale
	} as ResGetUserLocale
}

export const setUserLocale = async (locale: Locales) => {
	if (!isLocale(locale)) return

	const now = new Date()

	;(await cookies()).set(LOCALE, locale, { expires: now.setFullYear(now.getFullYear() + 3) })
}

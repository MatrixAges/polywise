'use client'

import { LOCALE } from '@website/app.config'
import { useMemoizedFn } from '@website/hooks/ahooks'
import { usePathname, useRouter } from '@website/i18n/navigation'
import { useLocale as useNextLocale } from 'next-intl'

import useCookie from './useCookie'

import type { Locales } from '@website/app.config'

export default () => {
	const locale = useNextLocale() as Locales
	const pathname = usePathname()
	const router = useRouter()
	const [, setLocaleCookie] = useCookie(LOCALE)

	const setLocale = useMemoizedFn((next_locale: Locales) => {
		setLocaleCookie(next_locale)
		router.replace(pathname, { locale: next_locale })

		if (window.__search_index__) {
			// @ts-ignore
			window.__search_index__ = null
		}
	})

	return { locale, setLocale }
}

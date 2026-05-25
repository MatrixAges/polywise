'use client'

import { LOCALE } from '@website/app.config'
import { useMemoizedFn } from '@website/hooks/ahooks'
import { useLocale as useNextLocale } from 'next-intl'
import { usePathname, useRouter } from 'next/navigation'

import useCookie from './useCookie'

import type { Locales } from '@website/app.config'

export default () => {
	const locale = useNextLocale() as Locales
	const pathname = usePathname()
	const router = useRouter()
	const [, setLocaleCookie] = useCookie(LOCALE)

	const setLocale = useMemoizedFn((v: Locales) => {
		console.log(v)
		setLocaleCookie(v)
		router.replace(pathname)

		if (window.__search_index__) {
			// @ts-ignore
			window.__search_index__ = null
		}
	})

	return { locale, setLocale }
}

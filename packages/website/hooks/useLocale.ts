'use client'

import { LOCALE } from '@website/app.config'
import { useMemoizedFn } from '@website/hooks/ahooks'
import { useLocale as useNextLocale } from 'next-intl'
import { useRouter } from 'next/navigation'

import useCookie from './useCookie'

import type { Locales } from '@website/app.config'

export default () => {
	const locale = useNextLocale() as Locales
	const router = useRouter()
	const [, setLocaleCookie] = useCookie(LOCALE)

	const setLocale = useMemoizedFn((v: Locales) => {
		if (v === locale) return

		setLocaleCookie(v)
		router.refresh()

		if (window.__search_index__) {
			// @ts-ignore
			window.__search_index__ = null
		}
	})

	return { locale, setLocale }
}

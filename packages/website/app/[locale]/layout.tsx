import { locales } from '@website/app.config'
import { hasLocale } from 'next-intl'
import { notFound } from 'next/navigation'

import type { PropsWithChildren } from 'react'

export function generateStaticParams() {
	return locales.map(locale => ({ locale }))
}

const LocaleLayout = async ({ children, params }: PropsWithChildren<{ params: Promise<{ locale: string }> }>) => {
	const { locale } = await params

	if (!hasLocale(locales, locale)) {
		notFound()
	}

	return children
}

export default LocaleLayout

import { default_locale, locales } from '@website/app.config'
import { defineRouting } from 'next-intl/routing'

export const routing = defineRouting({
	locales: [...locales],
	defaultLocale: default_locale,
	localePrefix: 'always'
})

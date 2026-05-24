export const LOCALE = 'POLYWISE_WEBSITE_LOCALE'
export const THEME = 'POLYWISE_WEBSITE_THEME'
export const FORCE_DARK = 'POLYWISE_WEBSITE_FORCE_DARK'

export const locales = ['en', 'zh', 'ja'] as const
export const default_locale = 'en' as const

export type Locales = (typeof locales)[number]

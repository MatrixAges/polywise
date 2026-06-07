import dayjs from 'dayjs'
import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'
import { local } from 'stk/storage'
import { config, locales } from 'zod'

import conf from './conf'
import getLang from './getLang'

import type { Lang } from '@/types'
import type { BackendModule } from 'i18next'

export const eager_locale_namespaces = ['translation', 'layout', 'components'] as const

export const resourcesToBackend = {
	type: 'backend',
	read: (lang, namespace, callback) => {
		import(`@/locales/${lang.toLowerCase()}/${namespace}`).then(data => {
			callback(null, data.default)
		})
	}
} as BackendModule

let active_lang = null as Lang | null
let ready_promise = null as Promise<typeof i18next> | null

const getStoredLang = () => {
	const local_lang = local.lang

	if (local_lang === 'en' || local_lang === 'zh-cn') {
		return local_lang
	}

	const next_lang = conf.get('lang')

	if (typeof next_lang !== 'string') {
		return null
	}

	return next_lang === 'en' || next_lang === 'zh-cn' ? next_lang : null
}

export const resolveLocaleLang = (lang?: Lang | null): Lang => {
	if (lang) {
		return lang
	}

	if (active_lang) {
		return active_lang
	}

	const current_lang = i18next.resolvedLanguage || i18next.language

	if (current_lang === 'en' || current_lang === 'zh-cn') {
		return current_lang
	}

	const stored_lang = getStoredLang()

	if (stored_lang) {
		return stored_lang
	}

	return getLang(navigator.language) === 'zh-cn' ? 'zh-cn' : 'en'
}

const applyZodLocale = (lang: Lang) => {
	switch (lang) {
		case 'en':
			config(locales.en())
			return
		case 'zh-cn':
			config(locales.zhCN())
			return
	}
}

const initI18n = async (lang: Lang) => {
	if (!i18next.isInitialized) {
		await i18next
			.use(resourcesToBackend)
			.use(initReactI18next)
			.init({
				lng: lang,
				ns: [...eager_locale_namespaces],
				defaultNS: 'translation',
				fallbackLng: 'en',
				load: 'currentOnly',
				returnObjects: true,
				interpolation: { escapeValue: false },
				react: { useSuspense: false }
			})
	} else if (i18next.resolvedLanguage !== lang && i18next.language !== lang) {
		await i18next.changeLanguage(lang)
		await i18next.loadNamespaces([...eager_locale_namespaces])
	}

	const res = await import(`@/locales/dayjs/${lang}`)

	dayjs.locale(lang, res.default)
	applyZodLocale(lang)
	active_lang = lang
	$t = i18next.t

	return i18next
}

export const ensureI18nReady = async (lang?: Lang | null) => {
	const next_lang = resolveLocaleLang(lang)

	if (!ready_promise || active_lang !== next_lang) {
		ready_promise = initI18n(next_lang)
	}

	return ready_promise
}

export const preloadNamespaces = async (namespaces: Array<string>, lang?: Lang | null) => {
	const i18n = await ensureI18nReady(lang)

	await i18n.loadNamespaces(namespaces)

	return i18n
}

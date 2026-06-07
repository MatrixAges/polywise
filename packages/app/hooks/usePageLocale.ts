import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'

import { preloadNamespaces } from '@/utils'

const page_locale_namespaces = ['home', 'session', 'agent', 'linkcase', 'post', 'article', 'setting'] as const

type PageLocaleNamespace = (typeof page_locale_namespaces)[number]

const normalizeNamespaces = (namespace: PageLocaleNamespace | Array<PageLocaleNamespace>) =>
	Array.isArray(namespace) ? namespace : [namespace]

export const loadPageLocale = async (namespace: PageLocaleNamespace | Array<PageLocaleNamespace>) => {
	await preloadNamespaces(normalizeNamespaces(namespace))

	return null
}

export const usePageLocaleCleanup = (namespace: PageLocaleNamespace | Array<PageLocaleNamespace>) => {
	const namespaces = normalizeNamespaces(namespace)
	const { i18n } = useTranslation(namespaces)

	useEffect(() => {
		return () => {
			const lang = (i18n.resolvedLanguage || i18n.language || 'en').toLowerCase()

			namespaces.forEach(item => {
				if (i18n.hasResourceBundle(lang, item)) {
					i18n.removeResourceBundle(lang, item)
				}
			})
		}
	}, [i18n, namespaces.join('|')])
}

export default <T extends PageLocaleNamespace>(namespace: T) => {
	const { t } = useTranslation(namespace)

	usePageLocaleCleanup(namespace)

	return t
}

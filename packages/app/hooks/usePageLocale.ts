import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'

const page_locale_namespaces = ['home', 'session', 'agent', 'linkcase', 'post', 'article', 'setting'] as const

type PageLocaleNamespace = (typeof page_locale_namespaces)[number]

export default <T extends PageLocaleNamespace>(namespace: T) => {
	const { i18n, t } = useTranslation(namespace)

	useEffect(() => {
		void i18n.loadNamespaces(namespace)

		return () => {
			const lang = (i18n.resolvedLanguage || i18n.language || 'en').toLowerCase()

			if (i18n.hasResourceBundle(lang, namespace)) {
				i18n.removeResourceBundle(lang, namespace)
			}
		}
	}, [i18n, namespace])

	return t
}

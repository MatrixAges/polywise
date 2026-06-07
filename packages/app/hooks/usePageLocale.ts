import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'

export default (namespace: 'home' | 'session' | 'agent' | 'linkcase' | 'post' | 'article' | 'setting') => {
	const { i18n, t } = useTranslation(namespace)
	const raw_i18n = i18n as unknown as {
		t: (key: string, options?: Record<string, unknown>) => string
		loadNamespaces: (namespace: string) => Promise<unknown>
		resolvedLanguage?: string
		language?: string
		hasResourceBundle: (lang: string, namespace: string) => boolean
		removeResourceBundle: (lang: string, namespace: string) => void
	}

	useEffect(() => {
		void raw_i18n.loadNamespaces(namespace)

		return () => {
			const lang = (raw_i18n.resolvedLanguage || raw_i18n.language || 'en').toLowerCase()

			if (raw_i18n.hasResourceBundle(lang, namespace)) {
				raw_i18n.removeResourceBundle(lang, namespace)
			}
		}
	}, [namespace, raw_i18n])

	return ((key: string, options?: Record<string, unknown>) =>
		raw_i18n.t(key, { ns: namespace, ...(options || {}) })) as (
		key: string,
		options?: Record<string, unknown>
	) => string
}

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

import type { BackendModule } from 'i18next'

export const resourcesToBackend = {
	type: 'backend',
	read: (lang, namespace, callback) => {
		import(`@/locales/${lang.toLowerCase()}/index`).then(data => {
			callback(null, data.default[namespace])
		})
	}
} as BackendModule

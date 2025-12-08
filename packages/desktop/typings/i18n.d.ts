import en from '../src/locales/en'

declare module 'i18next' {
	interface CustomTypeOptions {
		returnObjects: true
		resources: typeof en
	}
}

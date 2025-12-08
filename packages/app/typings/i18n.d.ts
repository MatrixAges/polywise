import { en } from '@/locales'

declare module 'i18next' {
	interface CustomTypeOptions {
		returnObjects: true
		resources: typeof en
	}
}

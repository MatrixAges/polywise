import type { Document as FlexDocument } from 'flexsearch'

interface ViewTransition {
	finished: Promise<void>
	ready: Promise<void>
	updateCallbackDone: Promise<void>
	skipTransition(): void
}

interface Document {
	startViewTransition(cb: () => Promise<void> | void): ViewTransition
}

declare interface Cookie {
	name: string
	domain: string
	path: string
	expires: Date | number
	sameSite: 'strict' | 'lax' | 'none'
	secure: boolean
	value: string
}

interface CookieStore {
	get(name: string): Promise<Cookie>
	getAll(name: string): Promise<Array<Cookie>>
	set(
		name: string,
		value: string,
		options?: Omit<Cookie, 'name' | 'value' | 'secure'> & { partitioned: boolean }
	): Promise<undefined>
	delete(name: string): Promise<undefined>
	change(e: any): any
	addEventListener(type: string, listener: (e: any) => any): any
	removeEventListener(type: string, listener: (e: any) => any): any
}

declare var cookieStore: CookieStore

declare global {
	interface Window {
		__search_index__: FlexDocument<
			{
				id: string
				link: string
				type: 'heading' | 'content'
				headings: string
				content: string
			},
			true
		>
	}
}

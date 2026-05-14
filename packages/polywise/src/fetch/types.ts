import type { WebfetchFallbackProvider } from '@core/types'

export type FetchSource = WebfetchFallbackProvider | 'direct'

export interface FetchAttempt {
	source: FetchSource
	error: string
}

export interface FetchProviderSuccess {
	ok: true
	source: FetchSource
	content: string
	truncated: boolean
}

export interface FetchSuccess extends FetchProviderSuccess {
	attempts: Array<FetchAttempt>
}

export interface FetchFailure {
	ok: false
	source: FetchSource
	error: string
	attempts: Array<FetchAttempt>
}

export type FetchProviderResult = FetchProviderSuccess
export type FetchResult = FetchSuccess | FetchFailure

export interface FetchProviderArgs {
	url: string
	max_chars: number
}

export type FetchProviderHandler = (args: FetchProviderArgs) => Promise<FetchProviderResult>

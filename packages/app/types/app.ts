export type Theme = 'light' | 'dark' | 'system'
export type ThemeValue = Exclude<Theme, 'system'>
export type Lang = 'en' | 'zh-cn'

export interface HasUpdate {
	type: 'has_update'
	version: string
}

export interface Downloading {
	type: 'downloading'
	percent: number
}

export interface UpdateError {
	type: 'error'
	message: string
}

export type UpdateState = null | HasUpdate | Downloading | UpdateError | { type: 'downloaded' }

export type Theme = 'light' | 'dark' | 'system'
export type ThemeValue = Exclude<Theme, 'system'>
export type Lang = 'en' | 'zh-cn'
export type Icon = string
export type IconType = 'icon' | 'emoji'

export interface HasUpdate {
	type: 'has_update'
	version: string
}

export interface Downloading {
	type: 'downloading'
	percent: number
}

export interface DownloadedUpdate {
	type: 'downloaded'
}

export interface UpdateError {
	type: 'error'
	message: string
}

export type UpdateState = null | HasUpdate | Downloading | DownloadedUpdate | UpdateError

export type DesktopUpdateEvent =
	| { type: 'can_update'; value: string }
	| { type: 'cant_update' }
	| { type: 'progress'; value: number }
	| { type: 'downloaded' }
	| { type: 'error'; value: string }

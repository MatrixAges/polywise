export type ModelStatus = 'available' | 'downloading' | 'incomplete' | 'error'

export interface LocalModel {
	id: string
	name: string
	path: string
	size: number
	status: ModelStatus
	last_checked?: string
	dtype?: string
	error?: string
}

export interface ModelDownloadProgress {
	model_id: string
	downloaded: number
	total: number
	speed: number
	status: 'downloading' | 'completed' | 'failed'
	error?: string
}

export interface ModelManagerArgs {
	models_dir?: string
	default_dtype?: string
}

export interface DownloadOptions {
	dtype?: string
	revision?: string
	progress_callback?: (progress: ModelDownloadProgress) => void
}

export interface ModelInfo {
	id: string
	name: string
	size: number
	last_modified?: string
	tags?: Array<string>
}

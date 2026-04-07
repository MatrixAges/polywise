export interface Operation {
	file_path: string
	old_string: string
	new_string: string
}

export interface Result {
	status: 'success' | 'error'
	message?: string
	file_path: string
	file_name: string
	lang: string
	patch: string
	edit_count: number
}

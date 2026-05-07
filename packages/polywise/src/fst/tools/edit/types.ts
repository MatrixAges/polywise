export interface Operation {
	file_path: string
	old_string: string
	new_string: string
}

export interface EditResult {
	status: 'success' | 'error'
	message?: string
	file_path: string
	patch?: string
	add_lines?: number
	remove_lines?: number
}

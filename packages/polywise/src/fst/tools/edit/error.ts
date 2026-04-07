import { basename } from 'path'

import getLangFromExt from './getLang'

export default (file_path: string, edit_count: number, message: string) => ({
	status: 'error' as const,
	message,
	file_path,
	file_name: file_path ? basename(file_path) : '',
	lang: file_path ? getLangFromExt(file_path) : 'text',
	patch: '',
	edit_count
})

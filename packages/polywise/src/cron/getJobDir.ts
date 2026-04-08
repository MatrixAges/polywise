import path from 'path'
import { app } from '@core/consts'

export default (name: string) => {
	if (name.includes('..') || name.includes('/') || name.includes('\\')) {
		throw new Error('Invalid name: path traversal or separators are not allowed')
	}

	if (!name.trim()) {
		throw new Error('Invalid name: cannot be empty')
	}

	return path.resolve(app.cron_dir, name)
}

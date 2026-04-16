import path from 'path'

export default (tools_dir: string, name: string) => {
	if (name.includes('..') || name.includes('/') || name.includes('\\')) {
		throw new Error('Invalid name: path traversal or separators are not allowed')
	}

	if (!name.trim()) {
		throw new Error('Invalid name: cannot be empty')
	}

	return path.resolve(tools_dir, name)
}

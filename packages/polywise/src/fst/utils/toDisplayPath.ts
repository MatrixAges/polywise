import path from 'path'

const normalizeVirtualPath = (virtual_path: string) => {
	if (!virtual_path || virtual_path === '.') return '/'

	const normalized_path = virtual_path.startsWith('/')
		? path.posix.normalize(virtual_path)
		: path.posix.normalize(`/${virtual_path}`)

	return normalized_path === '.' ? '/' : normalized_path
}

export const toDisplayPath = (args: { real_path: string; cwd: string; path_mappings?: Record<string, string> }) => {
	const { real_path, cwd, path_mappings = {} } = args
	const normalized_real_path = path.resolve(real_path)
	const mapping_list = Object.entries(path_mappings)
		.map(([prefix, mapped_dir]) => ({
			prefix,
			mapped_dir: path.resolve(mapped_dir)
		}))
		.sort((left, right) => right.mapped_dir.length - left.mapped_dir.length)

	for (const { prefix, mapped_dir } of mapping_list) {
		if (normalized_real_path === mapped_dir) return normalizeVirtualPath(prefix)

		const mapped_prefix = `${mapped_dir}${path.sep}`

		if (!normalized_real_path.startsWith(mapped_prefix)) continue

		const relative_path = path.relative(mapped_dir, normalized_real_path).split(path.sep).join('/')

		return normalizeVirtualPath(path.posix.join(prefix, relative_path))
	}

	const relative_path = path.relative(path.resolve(cwd), normalized_real_path).split(path.sep).join('/')

	return normalizeVirtualPath(relative_path)
}

export default toDisplayPath

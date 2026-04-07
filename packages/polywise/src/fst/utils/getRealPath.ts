import path from 'path'

export default (cwd: string, virtual_path: string, path_mappings: Record<string, string> = {}): string => {
	for (const [prefix, real_dir] of Object.entries(path_mappings)) {
		if (virtual_path === prefix || virtual_path.startsWith(prefix + '/')) {
			const relative = virtual_path.slice(prefix.length)

			return path.join(real_dir, relative || '.')
		}
	}

	return path.join(cwd, virtual_path)
}

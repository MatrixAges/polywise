import path from 'path'

export default (cwd: string, virtual_path: string): string => {
	if (path.posix.isAbsolute(virtual_path)) return path.join(cwd, virtual_path)

	return path.join(cwd, virtual_path)
}

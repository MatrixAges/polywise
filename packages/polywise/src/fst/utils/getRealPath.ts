import { join, posix } from 'path'

export default (cwd: string, virtual_path: string): string => {
	if (posix.isAbsolute(virtual_path)) return join(cwd, virtual_path)

	return join(cwd, virtual_path)
}

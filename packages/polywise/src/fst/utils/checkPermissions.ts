import checkPermission from './checkPermission'

import type Session from '../session'

export default async (s: Session, file_path: string, real_path: string) => {
	const read_error = await checkPermission(s, 'edit', 'read', real_path, file_path)

	if (read_error) return read_error

	const write_error = await checkPermission(s, 'edit', 'write', real_path)

	if (write_error) return write_error

	return null
}

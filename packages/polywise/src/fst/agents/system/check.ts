import { isPathInDir } from '@core/fst/utils'
import { minimatch } from 'minimatch'

import type Session from '../../session'

export default (s: Session, path: string): boolean => {
	return s.permissions.some(p => {
		if (p.tool !== 'file' || p.action !== 'read') return false

		return minimatch(path, p.path) || isPathInDir(path, p.path)
	})
}

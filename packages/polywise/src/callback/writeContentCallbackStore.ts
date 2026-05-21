import path from 'node:path'
import fs from 'fs-extra'

import type { ContentCallbackStore } from './types'

export default async (file_path: string, store: ContentCallbackStore) => {
	await fs.ensureDir(path.dirname(file_path))
	await fs.writeJSON(file_path, store, { spaces: 2 })
}

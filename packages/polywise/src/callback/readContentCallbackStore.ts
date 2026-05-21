import fs from 'fs-extra'

import type { ContentCallbackStore } from './types'

const default_store: ContentCallbackStore = {
	traces: {},
	applied_callbacks: {}
}

export default async (file_path: string): Promise<ContentCallbackStore> => {
	if (!(await fs.pathExists(file_path))) {
		return {
			traces: {},
			applied_callbacks: {}
		}
	}

	try {
		const raw = await fs.readJSON(file_path)

		return {
			traces: raw?.traces && typeof raw.traces === 'object' ? raw.traces : default_store.traces,
			applied_callbacks:
				raw?.applied_callbacks && typeof raw.applied_callbacks === 'object'
					? raw.applied_callbacks
					: default_store.applied_callbacks
		}
	} catch {
		return {
			traces: {},
			applied_callbacks: {}
		}
	}
}

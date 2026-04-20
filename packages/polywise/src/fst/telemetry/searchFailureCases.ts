import path from 'path'
import fs from 'fs-extra'

import grep from '../../utils/grep'
import getToolErrorFile from './getToolErrorFile'

import type { TelemetrySearchArgs } from './types'

export default async (args: TelemetrySearchArgs) => {
	const { app_path, tool_name, keywords, max_count = 5 } = args
	const patch_dir = path.resolve(app_path, 'patch')
	const tool_error_path = getToolErrorFile({ app_path, tool_name })
	const targets = [] as Array<string>

	if (await fs.pathExists(patch_dir)) {
		targets.push(patch_dir)
	}

	if (await fs.pathExists(tool_error_path)) {
		targets.push(tool_error_path)
	}

	if (targets.length === 0) {
		return [] as Array<string>
	}

	return grep(targets, keywords.filter(Boolean), {
		max_count,
		with_filename: true,
		with_line_number: true
	})
}

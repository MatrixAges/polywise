import path from 'path'
import fs from 'fs-extra'

import grep from '../../../utils/grep'

const getSafeToolName = (tool_name: string) => {
	return tool_name.replace(/[^a-zA-Z0-9_-]/g, '_')
}

export default async (args: { app_path: string; tool_name: string; keywords: Array<string>; max_count?: number }) => {
	const { app_path, tool_name, keywords, max_count = 5 } = args
	const patch_dir = path.resolve(app_path, 'patch')
	const tool_error_path = path.resolve(app_path, 'tool_call_errors', `${getSafeToolName(tool_name)}.jsonl`)
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

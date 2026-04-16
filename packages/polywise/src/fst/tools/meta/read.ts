import path from 'path'
import fs from 'fs-extra'

import rebuildCustomToolsMap from './rebuild'

import type Session from '../../session'

export default async (s: Session) => {
	const custom_tools_map_path = path.resolve(s.tools_dir, 'custom_tools_map.json')

	await fs.ensureDir(s.tools_dir)

	const exists = await fs.pathExists(custom_tools_map_path)

	if (!exists) {
		return rebuildCustomToolsMap(s)
	}

	const custom_tools_map = await fs.readJson(custom_tools_map_path, { throws: false })

	if (!Array.isArray(custom_tools_map)) {
		return rebuildCustomToolsMap(s)
	}

	s.custom_tools_map = custom_tools_map

	return custom_tools_map
}

import path from 'path'
import { writeFile } from 'atomically'
import fs from 'fs-extra'

import scanCustomToolsMap from './scan'

import type Session from '../../session'

export default async (s: Session) => {
	await fs.ensureDir(s.tools_dir)

	const custom_tools_map = await scanCustomToolsMap(s.tools_dir)
	const custom_tools_map_path = path.resolve(s.tools_dir, 'custom_tools_map.json')

	await fs.ensureDir(path.dirname(custom_tools_map_path))
	await writeFile(custom_tools_map_path, JSON.stringify(custom_tools_map, null, 4), 'utf8')

	s.custom_tools_map = custom_tools_map

	return custom_tools_map
}

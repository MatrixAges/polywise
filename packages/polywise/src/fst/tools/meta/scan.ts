import path from 'path'
import { readFile } from 'atomically'
import fs from 'fs-extra'

import extractHeadings from '../skill/headings'
import parseFrontmatter from '../skill/meta'

import type { CustomToolMeta } from '../../types'

export default async (dir: string) => {
	const map = [] as Array<CustomToolMeta>

	await fs.ensureDir(dir)

	const entries = await fs.readdir(dir, { withFileTypes: true })

	for (const entry of entries) {
		if (!entry.isDirectory()) continue

		const target_dir = path.resolve(dir, entry.name)
		const readme_path = path.resolve(target_dir, 'readme.md')
		const tool_path = path.resolve(target_dir, 'index.mjs')

		const [has_readme, has_tool] = await Promise.all([fs.pathExists(readme_path), fs.pathExists(tool_path)])

		if (!has_readme || !has_tool) continue

		try {
			const content = await readFile(readme_path, 'utf8')
			const meta = parseFrontmatter(content)

			if (meta) {
				map.push({
					name: meta.name,
					description: meta.description
				})

				continue
			}

			map.push({
				name: entry.name,
				description: extractHeadings(content)
			})
		} catch {
			continue
		}
	}

	return map
}

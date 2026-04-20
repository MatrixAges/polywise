import path from 'path'
import { readFile } from 'atomically'
import fs from 'fs-extra'

import extractHeadings from './headings'
import parseFrontmatter from './meta'

import type { SkillMeta } from '../../types'

export default async (dir: string) => {
	const map: Array<SkillMeta> = []

	const entries = await fs.readdir(dir, { withFileTypes: true })

	for (const entry of entries) {
		if (!entry.isDirectory()) continue

		const skill_md_path = path.resolve(dir, entry.name, 'SKILL.md')

		try {
			const content = await readFile(skill_md_path, 'utf8')
			const meta = parseFrontmatter(content)

			if (meta) {
				map.push({
					name: meta.name,
					description: meta.description
				})
			} else {
				const heading_text = extractHeadings(content)

				map.push({
					name: entry.name,
					description: heading_text
				})
			}
		} catch {
			continue
		}
	}

	return map
}

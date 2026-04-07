import { resolve } from 'path'
import { readFile } from 'atomically'
import { readdir } from 'fs-extra'
import { globby } from 'globby'

import extractHeadings from './headings'
import parseFrontmatter from './meta'

import type { SkillMeta } from '../../types'

export default async (cwd: string): Promise<Array<SkillMeta>> => {
	const dirs = await globby('**/skills', {
		cwd,
		onlyDirectories: true,
		absolute: true,
		gitignore: false,
		dot: true
	})

	const map: Array<SkillMeta> = []

	for (const skills_dir of dirs) {
		try {
			const entries = await readdir(skills_dir, { withFileTypes: true })

			for (const entry of entries) {
				if (!entry.isDirectory()) continue

				const skill_md_path = resolve(skills_dir, entry.name, 'SKILL.md')

				try {
					const content = await readFile(skill_md_path, 'utf8')
					const meta = parseFrontmatter(content)

					if (meta) {
						map.push({
							name: meta.name,
							description: meta.description,
							path: skill_md_path,
							dir: resolve(skills_dir, entry.name)
						})
					} else {
						const heading_text = extractHeadings(content)

						map.push({
							name: entry.name,
							description: heading_text,
							path: skill_md_path,
							dir: resolve(skills_dir, entry.name)
						})
					}
				} catch {
					continue
				}
			}
		} catch {
			continue
		}
	}

	return map
}

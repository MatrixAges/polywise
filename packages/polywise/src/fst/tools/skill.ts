import { resolve } from 'path'
import { tool } from 'ai'
import { readFile } from 'atomically'
import { readdir } from 'fs-extra'
import { remark } from 'remark'
import { literal, number, object, string, union } from 'zod'

import { checkPermission } from '../utils'

import type { Bash } from 'just-bash'
import type { Heading, Root } from 'mdast'
import type Session from '../session'
import type { SkillMeta } from '../types'

const search_schema = object({
	action: literal('search').describe('Action: search to find skills by keyword'),
	keyword: string().describe('Keywords to search for in skill names and descriptions'),
	max_results: number().optional().describe('Maximum results to return (default 5)')
})

const read_schema = object({
	action: literal('read').describe('Action: read to get full skill content'),
	skill_name: string().describe('The exact skill name to read')
})

const inputSchema = union([search_schema, read_schema])

const parseFrontmatter = (content: string): { name: string; description: string } | null => {
	const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/)

	if (!match) return null

	const frontmatter = match[1]
	const name_match = frontmatter.match(/^name:\s*(.+)$/m)
	const desc_match = frontmatter.match(/^description:\s*(.+)$/m)

	if (!name_match) return null

	return {
		name: name_match[1].trim(),
		description: desc_match ? desc_match[1].trim() : ''
	}
}

const extractHeadings = (content: string): string => {
	const ast = remark().parse(content) as Root
	const headings: Array<string> = []

	const walk = (node: unknown) => {
		const n = node as Record<string, unknown>

		if (n.type === 'heading') {
			const heading = n as unknown as Heading

			const text = heading.children
				.filter((c): c is { type: 'text'; value: string } => c.type === 'text')
				.map(c => c.value)
				.join(' ')

			if (text) headings.push(text)
		}

		if (Array.isArray(n.children)) {
			for (const child of n.children) walk(child)
		}
	}

	walk(ast)

	return headings.join(' | ')
}

export const buildSkillMap = async (cwd: string): Promise<Array<SkillMeta>> => {
	const skills_dir = resolve(cwd, 'skills')
	const map: Array<SkillMeta> = []

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
		return map
	}

	return map
}

const tokenize = (text: string): Array<string> => {
	return text
		.toLowerCase()
		.split(/[\s\-_.,;:!?/\\()[\]{}<>@#$%^&*+=|~`"']+/)
		.filter(t => t.length > 1)
}

const searchSkills = (
	skill_map: Array<SkillMeta>,
	keyword: string,
	max_results: number
): Array<SkillMeta & { score: number }> => {
	const tokens = tokenize(keyword)

	if (tokens.length === 0) return []

	const scored: Array<SkillMeta & { score: number }> = []

	for (const skill of skill_map) {
		const name_tokens = tokenize(skill.name)
		const desc_tokens = tokenize(skill.description)
		const all_tokens = [...name_tokens, ...desc_tokens]

		let hits = 0

		for (const token of tokens) {
			if (all_tokens.some(t => t.includes(token) || token.includes(t))) {
				hits++
			}
		}

		if (hits > 0) {
			scored.push({ ...skill, score: hits / tokens.length })
		}
	}

	scored.sort((a, b) => b.score - a.score)

	return scored.slice(0, max_results)
}

export const createSkillTool = (s: Session, bash: Bash) => {
	return tool({
		description: [
			'Search and read local skills from the skills/ directory.',
			'Use action "search" with keywords to find relevant skills by name and description.',
			'Use action "read" with an exact skill_name to get the full SKILL.md content.',
			'',
			'To discover, install, or update skills from the community, use web_fetch_tool',
			'with https://skills.sh/ to browse the skill directory, or use bash_tool to',
			'clone/install skill packages into the skills/ directory.'
		].join('\n'),
		inputSchema,
		execute: async input => {
			const { skill_map } = s

			if (input.action === 'search') {
				const max_results = input.max_results ?? 5
				const results = searchSkills(skill_map, input.keyword, max_results)

				if (results.length === 0) {
					return {
						action: 'search',
						keyword: input.keyword,
						results: [],
						count: 0,
						hint: 'No local skills matched. Consider browsing https://skills.sh/ with web_fetch_tool to find community skills.'
					}
				}

				return {
					action: 'search',
					keyword: input.keyword,
					results: results.map(r => ({
						name: r.name,
						description: r.description,
						path: r.path,
						score: r.score
					})),
					count: results.length
				}
			}

			if (input.action === 'read') {
				const target = skill_map.find(s => s.name === input.skill_name)

				if (!target) {
					return {
						action: 'read',
						skill_name: input.skill_name,
						content: '',
						error: `Skill "${input.skill_name}" not found in skill_map. Use action "search" to find available skills.`
					}
				}

				const perm_error = await checkPermission(s, 'file', 'read', target.path)

				if (perm_error) {
					return { action: 'read', skill_name: input.skill_name, content: '', error: perm_error }
				}

				const content = await readFile(target.path, 'utf8')

				return {
					action: 'read',
					skill_name: input.skill_name,
					content,
					path: target.path
				}
			}

			return { error: 'Unknown action' }
		}
	})
}

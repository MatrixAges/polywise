import path from 'path'
import { readFile, writeFile } from 'atomically'
import fs from 'fs-extra'
import { globby } from 'globby'

import getHash from '../../../utils/getHash'
import { checkPermission, isPathInDir } from '../../utils'

import type Session from '../../session'
import type { PromptKind, PromptMapCache, PromptMeta } from './types'

const prompt_patterns = ['CLAUDE.md', 'AGENTS.md', '.agent/**/*.md'] as const

const getPromptMapPath = (s: Session) => path.resolve(s.session_dir, 'prompt_map.json')

const getPromptRoot = async (s: Session) => {
	await s.getProject()

	if (s.scope.type === 'group' && s.caps.rel.getFolders && s.folders.length === 0) {
		await s.getFolders()
	}

	if (s.scope.type === 'project' && s.project?.dir) {
		return s.project.dir
	}

	if (s.scope.type === 'group') {
		return s.folders[0]?.path || s.project?.dir || s.files_dir
	}

	return s.files_dir
}

const getPromptKind = (relative_path: string): PromptKind => {
	if (relative_path === 'CLAUDE.md') return 'claude'
	if (relative_path === 'AGENTS.md') return 'agent'

	return 'agent-folder'
}

const normalizePromptPath = (prompt_path: string) => prompt_path.replace(/\\/g, '/').trim()

const isAllowedPromptPath = (prompt_path: string) => {
	const normalized = path.posix.normalize(normalizePromptPath(prompt_path).trim())

	if (
		!normalized ||
		normalized === '.' ||
		normalized.startsWith('/') ||
		normalized.startsWith('../') ||
		normalized.includes('/../')
	) {
		return false
	}

	if (normalized === 'CLAUDE.md' || normalized === 'AGENTS.md') {
		return true
	}

	return normalized.startsWith('.agent/') && normalized.endsWith('.md')
}

const truncate = (value: string, max_length: number) => {
	if (value.length <= max_length) return value

	return `${value.slice(0, max_length - 1).trimEnd()}...`
}

const cleanSummaryLine = (line: string) =>
	line
		.replace(/^[#>*\-\d.\s]+/, '')
		.replace(/[`*_~]+/g, '')
		.trim()

const createSummary = (content: string, kind: PromptKind) => {
	const raw_lines = content.split(/\r?\n/)
	let lines = raw_lines

	if (lines[0]?.trim() === '---') {
		const end = lines.findIndex((line, index) => index > 0 && line.trim() === '---')

		if (end > 0) {
			lines = lines.slice(end + 1)
		}
	}

	let in_code_fence = false
	const parts = [] as Array<string>

	for (const line of lines) {
		const trimmed = line.trim()

		if (!trimmed) continue
		if (trimmed.startsWith('```')) {
			in_code_fence = !in_code_fence
			continue
		}
		if (in_code_fence) continue

		const cleaned = cleanSummaryLine(trimmed)

		if (!cleaned) continue
		if (parts.includes(cleaned)) continue

		parts.push(cleaned)

		if (parts.join(' | ').length >= 280) {
			break
		}
	}

	if (parts.length === 0) {
		return kind === 'claude'
			? 'Workspace-level Claude prompt instructions.'
			: kind === 'agent'
				? 'Workspace-level agent prompt instructions.'
				: 'Agent prompt instructions from the .agent directory.'
	}

	return truncate(parts.join(' | '), 280)
}

const comparePromptPath = (a: string, b: string) => {
	const getPriority = (value: string) => {
		if (value === 'CLAUDE.md') return 0
		if (value === 'AGENTS.md') return 1

		return 2
	}

	return getPriority(a) - getPriority(b) || a.localeCompare(b)
}

const isSafeResolvedPath = (resolved_path: string, root: string) => isPathInDir(resolved_path, root)

const getExistingAncestor = async (target_path: string, root: string) => {
	let current = target_path
	const normalized_root = path.resolve(root)

	while (current.startsWith(normalized_root)) {
		if (await fs.pathExists(current)) {
			return current
		}

		const next = path.dirname(current)

		if (next === current) {
			break
		}

		current = next
	}

	return normalized_root
}

const scanPromptMap = async (root: string, previous_map: Array<PromptMeta>) => {
	const previous_map_by_path = new Map(previous_map.map(item => [item.path, item]))
	const matched = await globby(prompt_patterns, {
		cwd: root,
		dot: true,
		onlyFiles: true,
		followSymbolicLinks: false
	})
	const prompts = [] as Array<PromptMeta>

	for (const relative_path of matched.sort(comparePromptPath)) {
		const absolute_path = path.resolve(root, relative_path)
		try {
			const stat = await fs.lstat(absolute_path)

			if (stat.isSymbolicLink()) {
				continue
			}

			const resolved_absolute_path = await fs.realpath(absolute_path).catch(() => absolute_path)

			if (!isSafeResolvedPath(resolved_absolute_path, root)) {
				continue
			}

			const content = await readFile(absolute_path, 'utf8')
			const hash = getHash(content)
			const normalized_path = normalizePromptPath(relative_path)
			const current = previous_map_by_path.get(normalized_path)
			const kind = getPromptKind(normalized_path)

			prompts.push({
				path: normalized_path,
				absolute_path,
				kind,
				hash,
				summary: current?.hash === hash ? current.summary : createSummary(content, kind),
				line_count: current?.hash === hash ? current.line_count : content.split(/\r?\n/).length
			})
		} catch {
			continue
		}
	}

	return prompts
}

const readCachedPromptMap = async (s: Session): Promise<PromptMapCache | null> => {
	const prompt_map_path = getPromptMapPath(s)
	const exists = await fs.pathExists(prompt_map_path)

	if (!exists) {
		return null
	}

	const res = await fs.readJson(prompt_map_path, { throws: false })

	if (!res || typeof res !== 'object' || typeof res.root !== 'string' || !Array.isArray(res.prompts)) {
		return null
	}

	const prompts = (res.prompts as Array<unknown>)
		.map((item: any) => ({
			path: typeof item?.path === 'string' ? item.path : '',
			absolute_path: typeof item?.absolute_path === 'string' ? item.absolute_path : '',
			kind:
				item?.kind === 'claude' || item?.kind === 'agent' || item?.kind === 'agent-folder'
					? item.kind
					: 'agent-folder',
			hash: typeof item?.hash === 'string' ? item.hash : '',
			summary: typeof item?.summary === 'string' ? item.summary : '',
			line_count: typeof item?.line_count === 'number' ? item.line_count : 0
		}))
		.filter((item): item is PromptMeta => Boolean(item.path && item.absolute_path && item.hash))

	return {
		root: res.root,
		prompts
	}
}

const writePromptMap = async (s: Session, cache: PromptMapCache) => {
	const prompt_map_path = getPromptMapPath(s)

	await fs.ensureDir(path.dirname(prompt_map_path))
	await writeFile(prompt_map_path, JSON.stringify(cache, null, 4), 'utf8')
}

const isPromptMapEqual = (a: PromptMapCache | null, b: PromptMapCache) => JSON.stringify(a) === JSON.stringify(b)

export const readPromptMap = async (s: Session) => {
	const root = await getPromptRoot(s)

	if (!(await fs.pathExists(root))) {
		await writePromptMap(s, { root, prompts: [] })

		return []
	}

	const cached = await readCachedPromptMap(s)
	const prompts = await scanPromptMap(root, cached?.root === root ? cached.prompts : [])
	const next_cache = { root, prompts }

	if (!isPromptMapEqual(cached, next_cache)) {
		await writePromptMap(s, next_cache)
	}

	return prompts
}

export const rebuildPromptMap = async (s: Session) => {
	const root = await getPromptRoot(s)

	if (!(await fs.pathExists(root))) {
		await writePromptMap(s, { root, prompts: [] })

		return []
	}

	const prompts = await scanPromptMap(root, [])

	await writePromptMap(s, { root, prompts })

	return prompts
}

export const writePromptFile = async (args: {
	session: Session
	prompt_path: string
	content: string
	require_existing: boolean
}) => {
	const { session, content, require_existing } = args
	const prompt_path = path.posix.normalize(normalizePromptPath(args.prompt_path))

	if (!isAllowedPromptPath(prompt_path)) {
		return {
			error: 'prompt_path must be exactly CLAUDE.md, AGENTS.md, or a Markdown file under .agent/.'
		}
	}

	const root = await getPromptRoot(session)

	await fs.ensureDir(root)

	const absolute_path = path.resolve(root, prompt_path)
	const exists = await fs.pathExists(absolute_path)
	const ancestor = await getExistingAncestor(path.dirname(absolute_path), root)
	const resolved_ancestor = await fs.realpath(ancestor).catch(() => ancestor)

	if (!isSafeResolvedPath(resolved_ancestor, root)) {
		return { error: `Prompt "${prompt_path}" resolves outside the session prompt root.` }
	}

	if (require_existing && !exists) {
		return { error: `Prompt "${prompt_path}" does not exist. Use action "create" first.` }
	}

	if (!require_existing && exists) {
		return { error: `Prompt "${prompt_path}" already exists. Use action "update" instead.` }
	}

	if (exists) {
		const stat = await fs.lstat(absolute_path)

		if (stat.isSymbolicLink()) {
			return { error: `Prompt "${prompt_path}" cannot be updated through a symbolic link.` }
		}
	}

	const perm_error = await checkPermission(session, 'file', 'write', absolute_path)

	if (perm_error) {
		return { error: perm_error }
	}

	await fs.ensureDir(path.dirname(absolute_path))
	await writeFile(absolute_path, content, 'utf8')

	const prompt_map = await rebuildPromptMap(session)
	const current = prompt_map.find(item => item.path === prompt_path) ?? null

	return {
		prompt: current,
		count: prompt_map.length
	}
}

export const buildPromptInjectionPrompt = async (s: Session) => {
	const prompt_map = await readPromptMap(s)

	if (prompt_map.length === 0) {
		return ''
	}

	const sections = [] as Array<string>

	for (const prompt of prompt_map) {
		const perm_error = await checkPermission(s, 'file', 'read', prompt.absolute_path)

		if (perm_error) {
			continue
		}

		try {
			const content = await readFile(prompt.absolute_path, 'utf8')

			sections.push([`## Prompt File: ${prompt.path}`, `Kind: ${prompt.kind}`, content].join('\n\n'))
		} catch {
			continue
		}
	}

	if (sections.length === 0) {
		return ''
	}

	return [
		'# Workspace Prompt Files',
		'The following prompt files were discovered under the session prompt root.',
		'Treat them as additional system-level instructions.',
		'If the files conflict, prefer earlier files in this section over later files.',
		...sections
	].join('\n\n')
}

export const readPromptContent = async (
	s: Session,
	prompt_path: string,
	args?: {
		start_line?: number
		end_line?: number
	}
) => {
	const prompt_map = await readPromptMap(s)
	const target = prompt_map.find(item => item.path === prompt_path)

	if (!target) {
		return {
			error: `Prompt "${prompt_path}" not found. Use action "search" to discover available prompt files.`
		}
	}

	const perm_error = await checkPermission(s, 'file', 'read', target.absolute_path)

	if (perm_error) {
		return { error: perm_error }
	}

	let content = ''

	try {
		content = await readFile(target.absolute_path, 'utf8')
	} catch (error) {
		return {
			error: error instanceof Error ? error.message : `Failed to read prompt "${target.path}"`
		}
	}

	const lines = content.split(/\r?\n/)
	const start_line = Math.max(1, args?.start_line ?? 1)
	const end_line = Math.min(lines.length, args?.end_line ?? lines.length)

	if (start_line > end_line) {
		return { error: 'start_line must be less than or equal to end_line' }
	}

	return {
		prompt: target,
		start_line,
		end_line,
		total_lines: lines.length,
		content: lines.slice(start_line - 1, end_line).join('\n')
	}
}

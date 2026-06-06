import path from 'path'
import { app } from '@core/consts'
import { article, skill } from '@core/db/schema'
import { getSkill, setArticle } from '@core/db/services'
import { env } from '@core/env'
import getToolDir from '@core/fst/tools/meta/getToolDir'
import { parseJsonSchema, validateCustomToolImports } from '@core/fst/tools/meta/readSchemas'
import scanCustomToolsMap from '@core/fst/tools/meta/scan'
import { scanSkillMap } from '@core/fst/tools/skill'
import searchSkillMap from '@core/fst/tools/skill/search'
import { saveArticle } from '@core/io'
import { createSkill, rebuildGlobalSkillMap, updateSkill } from '@core/rpc/skill/utils'
import { log } from '@core/utils'
import { writeFile } from 'atomically'
import { eq } from 'drizzle-orm'
import fs from 'fs-extra'

import { hasReviewableMessages, readPthinkReviewWindow } from './analytics'
import { getPthinkConfig } from './constants'
import { defaultPthinkStatus, readPthinkStatus, writePthinkStatus } from './status'
import { synthesizePthinkReview } from './synthesize'

import type {
	PthinkGeneratedSkill,
	PthinkGeneratedTool,
	PthinkHistoryRecord,
	PthinkOutputKind,
	PthinkRunSummary,
	PthinkRuntime,
	PthinkRuntimeStatus
} from './types'

const report_history_limit = 60
const idle_reason_persist_ms = 5 * 60 * 1000
const required_skill_sections = [
	'## Trigger Conditions',
	'## Numbered Steps',
	'## Pitfalls',
	'## Verification Steps',
	'## Generalization Notes'
]

const defaultSummary = (): PthinkRunSummary => ({
	title: '',
	summary: '',
	kinds: [],
	article_ids: [],
	skill_names: [],
	tool_names: [],
	message_count: 0,
	window_start_at: 0,
	window_end_at: 0,
	created_at: Date.now()
})

const shouldRunInBackground = (status: PthinkRuntimeStatus) => {
	const current_config = getPthinkConfig()

	if (!current_config.enabled) {
		return { ok: false, reason: 'disabled' as const }
	}

	if (status.running) {
		return { ok: false, reason: 'already_running' as const }
	}

	if (env.active) {
		return { ok: false, reason: 'foreground_active' as const }
	}

	const last_active_at = Math.max(Number(status.last_foreground_at ?? 0), Number(status.last_visit_at ?? 0))

	if (Date.now() - last_active_at < current_config.idle_grace_ms) {
		return { ok: false, reason: 'idle_grace' as const }
	}

	const row = env.sqlite.prepare('SELECT id FROM session WHERE runing = 1 LIMIT 1').get() as
		| { id: string }
		| undefined

	if (row?.id) {
		return { ok: false, reason: 'session_running' as const }
	}

	return { ok: true as const }
}

const rebuildCustomToolsMapByDir = async (tools_dir: string) => {
	await fs.ensureDir(tools_dir)

	const custom_tools_map = await scanCustomToolsMap(tools_dir)
	const custom_tools_map_path = path.resolve(tools_dir, 'custom_tools_map.json')

	await writeFile(custom_tools_map_path, JSON.stringify(custom_tools_map, null, 4), 'utf8')

	return custom_tools_map
}

const writeCustomTool = async (tool: PthinkGeneratedTool) => {
	const tool_dir = getToolDir(path.resolve(app.app_path, 'tools'), tool.name)

	if (await fs.pathExists(tool_dir)) {
		return null
	}

	const input_schema = parseJsonSchema(tool.input_schema, 'input_schema')
	const output_schema = parseJsonSchema(tool.output_schema, 'output_schema')
	const entry = tool.entry || ''
	const readme = tool.readme.startsWith('---')
		? tool.readme
		: ['---', `name: ${tool.name}`, `description: ${tool.description}`, '---', '', tool.readme].join('\n')

	validateCustomToolImports(entry)

	await fs.ensureDir(tool_dir)
	await writeFile(path.resolve(tool_dir, 'readme.md'), readme, 'utf8')
	await writeFile(path.resolve(tool_dir, 'index.mjs'), entry, 'utf8')

	await rebuildCustomToolsMapByDir(path.resolve(app.app_path, 'tools'))

	return {
		name: tool.name,
		input_schema,
		output_schema
	}
}

const maybeWriteSkill = async (draft_skill: PthinkGeneratedSkill) => {
	if (draft_skill.action === 'skip' || !draft_skill.name || !draft_skill.description || !draft_skill.content) {
		return null
	}

	if (
		draft_skill.keywords.length < 2 ||
		required_skill_sections.some(section => !draft_skill.content.includes(section))
	) {
		return null
	}

	const skills_dir = path.resolve(app.app_path, 'skills')

	await fs.ensureDir(skills_dir)

	const skill_map = await scanSkillMap(skills_dir)
	const matches = searchSkillMap(skill_map, `${draft_skill.name} ${draft_skill.keywords.join(' ')}`, 1)
	const top_match = matches[0]

	if (draft_skill.action === 'create') {
		if (top_match?.score && top_match.score >= 0.75) {
			return null
		}

		await createSkill({
			name: draft_skill.name,
			desc: draft_skill.description,
			content: draft_skill.content
		})
		await rebuildGlobalSkillMap()

		return draft_skill.name
	}

	if (draft_skill.action === 'update') {
		const target_name = top_match?.name || draft_skill.name
		const current_skill = await getSkill(eq(skill.name, target_name))

		if (!current_skill) {
			return null
		}

		await updateSkill({
			id: current_skill.id,
			name: target_name,
			desc: draft_skill.description,
			content: draft_skill.content
		})
		await rebuildGlobalSkillMap()

		return target_name
	}

	return null
}

const createRecord = (args: {
	title: string
	summary: string
	article_ids: Array<string>
	skill_names: Array<string>
	tool_names: Array<string>
	message_count: number
	window_start_at: number
	window_end_at: number
	created_at: number
}): PthinkHistoryRecord => {
	const kinds = [] as Array<PthinkOutputKind>

	if (args.article_ids.length) kinds.push('article')
	if (args.skill_names.length) kinds.push('skill')
	if (args.tool_names.length) kinds.push('tool')

	return {
		title: args.title,
		summary: args.summary,
		kinds,
		article_ids: args.article_ids,
		skill_names: args.skill_names,
		tool_names: args.tool_names,
		message_count: args.message_count,
		window_start_at: args.window_start_at,
		window_end_at: args.window_end_at,
		created_at: args.created_at
	}
}

export const createPthinkRuntime = (): PthinkRuntime => {
	const status = defaultPthinkStatus()
	let monitor_timer: NodeJS.Timeout | null = null
	let last_idle_persist_at = 0

	const persistStatus = async () => {
		status.report_history = status.report_history
			.sort((a, b) => b.created_at - a.created_at)
			.slice(0, report_history_limit)
		await writePthinkStatus(status).catch(() => null)
	}

	const updateIdleReason = async (reason: string) => {
		const now = Date.now()
		status.last_status = 'idle'
		status.last_reason = reason

		if (now - last_idle_persist_at >= idle_reason_persist_ms) {
			last_idle_persist_at = now
			await persistStatus()
		}
	}

	const runMonitor = async () => {
		const allowed = shouldRunInBackground(status)

		if (!allowed.ok) {
			await updateIdleReason(allowed.reason)
			return
		}

		const current_config = getPthinkConfig()

		if (status.last_run_at && Date.now() - status.last_run_at < current_config.review_cooldown_ms) {
			await updateIdleReason('review_cooldown')
			return
		}

		const window = readPthinkReviewWindow({
			status,
			config: current_config
		})

		if (!hasReviewableMessages(window, current_config)) {
			await updateIdleReason(window.message_count > 0 ? 'not_enough_messages' : 'no_new_messages')
			return
		}

		await runtime.runNow()
	}

	const runtime: PthinkRuntime = {
		monitor_timer,
		status,
		async start() {
			const saved_status = await readPthinkStatus()

			Object.assign(status, {
				...saved_status,
				running: false,
				boot_at: Date.now(),
				last_foreground_at: Date.now(),
				last_visit_at: Number(saved_status.last_visit_at ?? Date.now())
			})

			monitor_timer = setInterval(() => {
				void runMonitor().catch(error => {
					log('SYSTEM', 'pthinkMonitorError', () =>
						error instanceof Error ? error.message : String(error)
					)
				})
			}, getPthinkConfig().monitor_ms)
			runtime.monitor_timer = monitor_timer
			await persistStatus()
			await runMonitor().catch(() => null)
		},
		async stop() {
			if (monitor_timer) {
				clearInterval(monitor_timer)
				monitor_timer = null
				runtime.monitor_timer = null
			}

			await persistStatus()
		},
		async runNow(args = {}) {
			if (status.running) {
				return null
			}

			const current_config = getPthinkConfig()
			const now = Date.now()
			const window = readPthinkReviewWindow({
				status,
				config: current_config,
				now
			})

			if (!args.force && !hasReviewableMessages(window, current_config)) {
				status.last_status = 'skipped'
				status.last_reason = window.message_count > 0 ? 'not_enough_messages' : 'no_new_messages'
				status.last_summary = defaultSummary()
				status.last_summary.created_at = now
				await persistStatus()
				return null
			}

			status.running = true
			status.last_status = 'running'
			status.last_error = null
			status.last_reason = null
			await persistStatus()

			try {
				const review = await synthesizePthinkReview({
					window,
					config: current_config
				})
				const article_ids = [] as Array<string>
				const skill_names = [] as Array<string>
				const tool_names = [] as Array<string>

				for (const draft_article of review.articles.slice(0, current_config.max_articles_per_run)) {
					if (draft_article.confidence < 0.62 || draft_article.content.length < 80) {
						continue
					}

					try {
						const article_id = await saveArticle({
							title: draft_article.title,
							content: draft_article.content,
							for: draft_article.for_type,
							source: 'pthink',
							scope_type: 'global',
							scope_id: null,
							exec_pipeline: true
						})

						await setArticle(eq(article.id, article_id), {
							metadata: {
								pthink: {
									kind: 'review',
									reason: draft_article.reason,
									confidence: draft_article.confidence,
									window_start_at: window.start_at,
									window_end_at: window.end_at,
									message_count: window.message_count
								}
							}
						}).catch(() => null)

						article_ids.push(article_id)
					} catch (error) {
						log('SYSTEM', 'pthinkArticleWriteError', () =>
							error instanceof Error ? error.message : String(error)
						)
					}
				}

				if (
					current_config.skill_generation_enabled &&
					review.skill &&
					review.skill.confidence >= 0.9 &&
					review.skill.content.includes('# ')
				) {
					const skill_name = await maybeWriteSkill(review.skill).catch(() => null)

					if (skill_name) {
						skill_names.push(skill_name)
					}
				}

				if (
					current_config.tool_generation_enabled &&
					review.tool &&
					review.tool.action === 'create' &&
					review.tool.confidence >= 0.95 &&
					review.tool.readme &&
					review.tool.entry &&
					review.tool.reason.length >= 24
				) {
					const created_tool = await writeCustomTool(review.tool).catch(() => null)

					if (created_tool) {
						tool_names.push(created_tool.name)
					}
				}

				const created_at = now
				const summary = createRecord({
					title: review.title,
					summary: review.summary,
					article_ids,
					skill_names,
					tool_names,
					message_count: window.message_count,
					window_start_at: window.start_at,
					window_end_at: window.end_at,
					created_at
				})

				status.last_run_at = created_at
				status.last_report_at = created_at
				status.last_review_at = window.end_at
				status.last_status = summary.kinds.length > 0 ? 'success' : 'skipped'
				status.last_error = null
				status.last_reason = summary.kinds.length > 0 ? null : 'no_durable_output'
				status.last_summary = summary

				if (summary.kinds.length > 0) {
					status.report_history.unshift(summary)
				}

				await persistStatus()

				return summary.kinds.length > 0 ? summary : null
			} catch (error) {
				const message = error instanceof Error ? error.message : String(error)
				status.last_run_at = now
				status.last_status = 'error'
				status.last_error = message
				status.last_reason = 'review_failed'
				status.last_summary = defaultSummary()
				status.last_summary.created_at = now
				await persistStatus()
				throw error
			} finally {
				status.running = false
				await persistStatus()
			}
		},
		touchForeground() {
			status.last_foreground_at = Date.now()
			if (!status.running) {
				status.last_status = 'idle'
			}
		},
		touchVisit() {
			const now = Date.now()
			status.last_visit_at = now
			status.last_foreground_at = now
			if (!status.running) {
				status.last_status = 'idle'
			}
		}
	}

	return runtime
}

import path from 'path'
import { tool } from 'ai'
import fs from 'fs-extra'
import { enum as Enum, object, string } from 'zod'

import type Session from '../session'

const metadata_schema = object({
	version: string().describe('Plan document format version'),
	updated_at: string().describe('ISO timestamp for the latest plan save')
})

const inputSchema = object({
	action: Enum(['save', 'get', 'clear']).describe(
		'The action to perform. save: overwrite session_dir/plan.md with a full plan. get: read the current plan. clear: remove the current plan file.'
	),
	goal: string().optional().describe('[Required for save] Short goal statement for the overall task'),
	tasks: string()
		.optional()
		.describe(
			'[Required for save] Concise task list markdown. Each task must include intro, dependencies, parallelism, file refs, and acceptance.'
		),
	flow: string()
		.optional()
		.describe('[Required for save] Mermaid flow body only, without fenced code block markers'),
	overall_acceptance: string()
		.optional()
		.describe('[Required for save] Markdown bullet list describing overall delivery criteria')
})

const getPlanPath = (session: Session) => {
	return path.resolve(session.session_dir, 'plan.md')
}

const getMetadataBlock = (updated_at: string) => {
	return [`version: 1`, `updated_at: ${updated_at}`].join('\n')
}

const getMetadataValue = (value: string) => {
	return value.trim().replace(/^['"]|['"]$/g, '')
}

const getMetadata = (content: string) => {
	const metadata = {} as { version?: string; updated_at?: string }

	for (const line of content.split('\n')) {
		const matched = line.match(/^([a-z_]+):\s*(.+)$/)

		if (!matched) continue

		const key = matched[1]
		const value = getMetadataValue(matched[2])

		if (key === 'version') metadata.version = value
		if (key === 'updated_at') metadata.updated_at = value
	}

	return metadata
}

const getPlanContent = (args: {
	goal: string
	tasks: string
	flow: string
	overall_acceptance: string
	updated_at: string
}) => {
	const { goal, tasks, flow, overall_acceptance, updated_at } = args
	const metadata_block = getMetadataBlock(updated_at)

	return [
		'---',
		metadata_block,
		'---',
		'',
		'# Plan',
		'',
		'## Goal',
		goal.trim(),
		'',
		'## Tasks',
		tasks.trim(),
		'',
		'## Flow',
		'```mermaid',
		flow.trim(),
		'```',
		'',
		'## Overall Acceptance',
		overall_acceptance.trim(),
		''
	].join('\n')
}

const parsePlanFile = (content: string) => {
	const matched = content.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/)

	if (!matched) {
		return {
			metadata: null,
			content,
			error: 'Invalid plan metadata block'
		}
	}

	const metadata_result = metadata_schema.safeParse(getMetadata(matched[1]))

	if (!metadata_result.success) {
		return {
			metadata: null,
			content: matched[2].trim(),
			error: 'Invalid plan metadata fields'
		}
	}

	return {
		metadata: metadata_result.data,
		content: matched[2].trim(),
		error: null
	}
}

export const createPlanTool = (session: Session) => {
	return tool({
		description: [
			'Manage the long-running execution plan for the current session.',
			'Use save to overwrite session_dir/plan.md with a concise full plan.',
			'Plans must include task details, dependencies, parallelism, a mermaid execution flow, and overall acceptance criteria.'
		].join('\n'),
		inputSchema,
		execute: async input => {
			const plan_path = getPlanPath(session)

			if (input.action === 'save') {
				if (!input.goal) return { action: 'save', error: 'goal is required for save action' }
				if (!input.tasks) return { action: 'save', error: 'tasks is required for save action' }
				if (!input.flow) return { action: 'save', error: 'flow is required for save action' }
				if (!input.overall_acceptance) {
					return { action: 'save', error: 'overall_acceptance is required for save action' }
				}

				const updated_at = new Date().toISOString()
				const content = getPlanContent({
					goal: input.goal,
					tasks: input.tasks,
					flow: input.flow,
					overall_acceptance: input.overall_acceptance,
					updated_at
				})

				await fs.ensureDir(path.dirname(plan_path))
				await fs.writeFile(plan_path, content, 'utf8')

				return {
					action: 'save',
					saved: true,
					metadata: {
						version: '1',
						updated_at
					}
				}
			}

			if (input.action === 'get') {
				const exists = await fs.pathExists(plan_path)

				if (!exists) {
					return { action: 'get', error: 'plan.md not found' }
				}

				const content = await fs.readFile(plan_path, 'utf8')
				const parsed = parsePlanFile(content)

				return {
					action: 'get',
					metadata: parsed.metadata,
					content: parsed.content,
					error: parsed.error
				}
			}

			if (input.action === 'clear') {
				const exists = await fs.pathExists(plan_path)

				if (exists) {
					await fs.remove(plan_path)
				}

				return {
					action: 'clear',
					cleared: true
				}
			}

			return { error: 'Unknown action' }
		}
	})
}

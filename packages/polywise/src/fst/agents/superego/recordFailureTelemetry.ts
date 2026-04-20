import path from 'path'
import dayjs from 'dayjs'
import fs from 'fs-extra'

import searchFailureTelemetry from './searchFailureTelemetry'

import type { FailureTelemetryRecord } from './types'

const getSignature = (tool_name: string, target: string, error_text: string) => {
	return `${tool_name} | ${target} | ${error_text}`.toLowerCase().replace(/\s+/g, ' ').trim()
}

const getSuggestedSkillName = (target: string, keywords: Array<string>) => {
	const parts = [target, ...keywords].join(' ').trim()

	if (!parts) return 'failure-recovery-skill'

	return parts
		.split(/[^a-zA-Z0-9]+/)
		.filter(Boolean)
		.slice(0, 6)
		.join(' ')
}

export default async (args: {
	app_path: string
	session_id: string
	tool_name: string
	error_text: string
	target: string
	keywords: Array<string>
}) => {
	const { app_path, session_id, tool_name, error_text, target, keywords } = args
	const date = dayjs().format('YYYY-MM-DD')
	const patch_dir = path.resolve(app_path, 'patch')
	const patch_path = path.resolve(patch_dir, `${date}.json`)
	const signature = getSignature(tool_name, target, error_text)

	await fs.ensureDir(patch_dir)

	const related_examples = await searchFailureTelemetry({
		app_path,
		tool_name,
		keywords: [error_text, ...keywords].filter(Boolean),
		max_count: 5
	})

	const current = (
		(await fs.pathExists(patch_path)) ? await fs.readJson(patch_path, { throws: false }) : []
	) as Array<FailureTelemetryRecord> | null
	const list = Array.isArray(current) ? current : []
	const current_index = list.findIndex(item => item.error_signature === signature)
	const now = new Date().toISOString()

	if (current_index >= 0) {
		const current_item = list[current_index]

		list[current_index] = {
			...current_item,
			keywords: Array.from(new Set([...current_item.keywords, ...keywords])).slice(0, 12),
			seen_count: current_item.seen_count + 1,
			last_seen_at: now,
			related_examples: Array.from(new Set([...current_item.related_examples, ...related_examples])).slice(
				0,
				5
			),
			suggested_action: current_item.seen_count + 1 >= 2 ? 'update' : current_item.suggested_action
		}

		await fs.writeJson(patch_path, list, { spaces: 4 })

		return list[current_index]
	}

	const next = {
		id: `${date}-${list.length + 1}`,
		date,
		session_id,
		tool_name,
		target,
		error_signature: signature,
		keywords: Array.from(new Set(keywords)).slice(0, 12),
		seen_count: 1,
		first_seen_at: now,
		last_seen_at: now,
		related_examples: related_examples.slice(0, 5),
		suggested_skill_name: getSuggestedSkillName(target, keywords),
		suggested_action: 'observe' as const,
		status: 'open' as const
	}

	list.push(next)

	await fs.writeJson(patch_path, list, { spaces: 4 })

	return next
}

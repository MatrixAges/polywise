import dayjs from 'dayjs'

import buildPatchSuggestion from './buildPatchSuggestion'
import readDailyPatch from './readDailyPatch'
import searchFailureCases from './searchFailureCases'
import writeDailyPatch from './writeDailyPatch'

import type { PatchRecord, TelemetryCollectArgs } from './types'

const getSignature = (tool_name: string, target: string, error_text: string) => {
	return `${tool_name} | ${target} | ${error_text}`.toLowerCase().replace(/\s+/g, ' ').trim()
}

export default async (args: TelemetryCollectArgs & { has_existing_skill?: boolean }) => {
	const date = dayjs().format('YYYY-MM-DD')
	const signature = getSignature(args.tool_name, args.target, args.error_text)
	const now = new Date().toISOString()
	const related_examples = await searchFailureCases({
		app_path: args.app_path,
		tool_name: args.tool_name,
		keywords: [args.error_text, ...args.keywords].filter(Boolean),
		max_count: 5
	})
	const list = await readDailyPatch({ app_path: args.app_path, date })
	const current_index = list.findIndex(item => item.error_signature === signature)

	if (current_index >= 0) {
		const current = list[current_index]
		const seen_count = current.seen_count + 1
		const keywords = Array.from(new Set([...current.keywords, ...args.keywords])).slice(0, 12)
		const merged_examples = Array.from(new Set([...current.related_examples, ...related_examples])).slice(0, 5)

		list[current_index] = {
			...current,
			keywords,
			seen_count,
			last_seen_at: now,
			related_examples: merged_examples,
			suggestion: buildPatchSuggestion({
				target: args.target,
				keywords,
				seen_count,
				related_examples: merged_examples,
				has_existing_skill: args.has_existing_skill ?? current.suggestion.suggested_action === 'update'
			})
		}

		await writeDailyPatch({ app_path: args.app_path, date, records: list })

		return list[current_index]
	}

	const record = {
		id: `${date}-${list.length + 1}`,
		date,
		session_id: args.session_id,
		tool_name: args.tool_name,
		target: args.target,
		error_signature: signature,
		keywords: Array.from(new Set(args.keywords)).slice(0, 12),
		seen_count: 1,
		first_seen_at: now,
		last_seen_at: now,
		related_examples: related_examples.slice(0, 5),
		suggestion: buildPatchSuggestion({
			target: args.target,
			keywords: Array.from(new Set(args.keywords)).slice(0, 12),
			seen_count: 1,
			related_examples: related_examples.slice(0, 5),
			has_existing_skill: args.has_existing_skill ?? false
		}),
		status: 'open'
	} as PatchRecord

	list.push(record)

	await writeDailyPatch({ app_path: args.app_path, date, records: list })

	return record
}

import type { PatchSuggestion, PatchSuggestionLevel } from './types'

const getSuggestedSkillName = (target: string, keywords: Array<string>) => {
	const parts = [target, ...keywords].join(' ').trim()

	if (!parts) return 'failure-recovery-skill'

	return parts
		.split(/[^a-zA-Z0-9]+/)
		.filter(Boolean)
		.slice(0, 6)
		.join(' ')
}

const getLevel = (args: { seen_count: number; has_examples: boolean; has_existing_skill: boolean }) => {
	const { seen_count, has_examples, has_existing_skill } = args

	if (seen_count >= 3) {
		return 'escalate' as PatchSuggestionLevel
	}

	if (seen_count >= 2 || has_existing_skill || has_examples) {
		return 'patch' as PatchSuggestionLevel
	}

	return 'observe' as PatchSuggestionLevel
}

export default (args: {
	target: string
	keywords: Array<string>
	seen_count: number
	related_examples: Array<string>
	has_existing_skill: boolean
}) => {
	const level = getLevel({
		seen_count: args.seen_count,
		has_examples: args.related_examples.length > 0,
		has_existing_skill: args.has_existing_skill
	})

	const suggestion = {
		level,
		reason:
			level === 'escalate'
				? 'Repeated failure across sessions should force a higher-priority skill patch decision.'
				: level === 'patch'
					? 'Repeated or related failures indicate this workflow should prefer patching an existing skill.'
					: 'First occurrence should be observed before patching or creating a skill.',
		suggested_skill_name: getSuggestedSkillName(args.target, args.keywords),
		suggested_action: level === 'observe' ? 'observe' : args.has_existing_skill ? 'update' : 'create',
		confidence: level === 'escalate' ? 0.95 : level === 'patch' ? 0.75 : 0.4
	} as PatchSuggestion

	return suggestion
}

export default (args: {
	conversation: string
	complexity_signal: unknown
	failure_telemetry: unknown
	related_failures: Array<string>
	related_skill_name: string
	related_skill_score: number
	related_skill: string
	patch_priority: 'observe' | 'patch' | 'escalate'
	existing_skill_preferred_action: 'observe' | 'update' | 'create'
}) => {
	return [
		'Create a skill draft only if the workflow is reusable.',
		'',
		'## Complexity Signal',
		JSON.stringify(args.complexity_signal, null, 2),
		'',
		'## Failure Telemetry',
		args.failure_telemetry ? JSON.stringify(args.failure_telemetry, null, 2) : 'null',
		'',
		'## Related Failure Cases',
		args.related_failures.length > 0 ? args.related_failures.join('\n') : 'None',
		'',
		'## Existing Skill Match',
		JSON.stringify(
			{
				related_skill_name: args.related_skill_name,
				related_skill_score: args.related_skill_score,
				patch_priority: args.patch_priority,
				existing_skill_preferred_action: args.existing_skill_preferred_action
			},
			null,
			2
		),
		'',
		'## Related Skill Content',
		args.related_skill || 'None',
		'',
		'## Conversation Fragment',
		args.conversation
	].join('\n')
}

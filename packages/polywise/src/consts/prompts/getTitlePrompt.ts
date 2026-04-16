export default (args: { recent_messages: string; title: string; focus?: string; intent?: string }) => {
	return [
		`Current session title: ${args.title}`,
		args.focus ? `Current topic focus: ${args.focus}` : '',
		args.intent ? `Context intent: ${args.intent}` : '',
		args.recent_messages ? `Recent messages:\n${args.recent_messages}` : '',
		'',
		'Generate one concise and accurate session title for the current user topic.',
		'The title must stay in the same language as the topic.',
		'Do not use quotation marks.',
		'Do not include explanation.',
		'Prefer a short phrase, not a full sentence.'
	]
		.filter(Boolean)
		.join('\n\n')
}

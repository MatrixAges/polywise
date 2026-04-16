import system_prompt from './trim_prompt.md'

export default (args: {
	intent?: string
	context?: string
	tasks?: string
	trimmed_text: string
	remaining_text: string
}) => {
	const intent_text = args.intent ? `Current intent: ${args.intent}` : ''
	const context_text = args.context ? `Current context:\n${args.context}` : ''
	const tasks_text = args.tasks ? `Current tasks:\n${args.tasks}` : ''

	return [
		system_prompt,
		'',
		'---',
		'',
		intent_text,
		context_text,
		tasks_text,
		args.trimmed_text ? `## Trimmed Messages\n${args.trimmed_text}` : '',
		args.remaining_text ? `## Remaining Messages\n${args.remaining_text}` : '',
		'',
		'Analyze the above and output the result as JSON.'
	]
		.filter(Boolean)
		.join('\n\n')
}

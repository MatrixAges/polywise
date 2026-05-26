export default (conversation: string) => {
	return [
		'Analyze the conversation fragment below.',
		'Apply the learning loop defined in your system instructions.',
		'Only store durable value.',
		'For skills, prefer search -> read -> create or update when a reusable workflow exists.',
		'If the complexity signal says the task is not complex, be conservative about skill creation.',
		'',
		'---',
		'',
		conversation
	].join('\n')
}

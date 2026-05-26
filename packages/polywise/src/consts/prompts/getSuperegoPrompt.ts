export default (conversation: string) => {
	return [
		'Analyze the conversation fragment below.',
		'Apply the learning loop defined in your system instructions.',
		'Only store durable value.',
		'Extract only memory or wiki value here. Leave skill creation to post-think review.',
		'',
		'---',
		'',
		conversation
	].join('\n')
}

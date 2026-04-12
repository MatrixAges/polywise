export default (recent_parts: Array<string>): string => {
	const parts_text = recent_parts.slice(-6).join('\n\n')

	return [
		'You are a chaos detector for an AI coding assistant session.',
		'Analyze the recent assistant outputs and determine if the agent陷入了混乱.',
		'',
		'Chaos indicators:',
		'- Repetitive content: The agent repeats similar content or expressions',
		'- Circular reasoning: The agent goes in circles on the same issue',
		'- Self-talk: The agent talks to itself without making progress',
		'- Stuck patterns: The agent is stuck in a fixed pattern and cannot break out',
		'',
		'Not chaos:',
		'- Iterative improvement: The agent gradually improves the solution',
		'- Exploration: The agent tries different approaches',
		'- Debugging: The agent tries different methods during debugging',
		'',
		'Recent assistant outputs:',
		parts_text,
		'',
		'Return a JSON object with is_chaos (boolean) and reason (string).'
	].join('\n\n')
}

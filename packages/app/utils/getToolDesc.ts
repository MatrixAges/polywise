import type { ToolUIPart } from 'ai'

export default (part: ToolUIPart) => {
	const type = part.type.replace('tool-', '')

	switch (type) {
		case 'bash_tool':
			return (part.input as { command: string })?.command
		case 'web_search_tool':
			return (part.input as { query: string })?.query
		case 'web_fetch_tool':
			return (part.input as { url: string })?.url
	}

	return
}

import {
	ALargeSmall,
	BookMarked,
	Bot,
	FileText,
	Globe,
	MessageCircleQuestionMark,
	PencilLine,
	Search,
	SquareTerminal,
	Terminal,
	Wrench
} from 'lucide-react'

import type { LucideIcon } from 'lucide-react'

type ToolIconTarget = {
	type: string
	toolName?: string
}

const getToolKey = (tool: ToolIconTarget | string) => {
	if (typeof tool === 'string') return tool.toLowerCase()

	if (tool.type === 'dynamic-tool') return (tool.toolName ?? tool.type).toLowerCase()

	return tool.type.replace(/^tool-/, '').toLowerCase()
}

export default (tool: ToolIconTarget | string): LucideIcon => {
	const key = getToolKey(tool)

	if (key.includes('title_tool')) return ALargeSmall
	if (key.includes('read') && key.includes('file')) return SquareTerminal
	if (key.includes('search')) return Search
	if (key.includes('glob') || key.includes('list')) return Search
	if (key.includes('fetch') || key.includes('web') || key.includes('http')) return Globe
	if (
		key.includes('bash') ||
		key.includes('shell') ||
		key.includes('command') ||
		key.includes('terminal') ||
		key.includes('exec')
	) {
		return Terminal
	}
	if (key.includes('edit') || key.includes('write') || key.includes('patch') || key.includes('create_file')) {
		return PencilLine
	}
	if (key.includes('question') || key.includes('ask')) return MessageCircleQuestionMark
	if (key.includes('system') || key.includes('agent')) return Bot
	if (key.includes('context')) return BookMarked
	if (key.includes('report')) return FileText

	return Wrench
}

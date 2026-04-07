import type { Context, Permissions } from '../../types'

export const formatPermissions = (permissions: Permissions): string => {
	if (permissions.length === 0) {
		return 'No previously approved permissions'
	}

	const lines = permissions.map(p => `- ${p.tool} ${p.action} ${p.path}`)

	return `Previously approved permissions:\n${lines.join('\n')}`
}

export const formatContext = (context: Context): string => {
	const parts: Array<string> = []

	if (context.intent) {
		parts.push(`User Intent: ${context.intent}`)
	}

	if (context.context) {
		parts.push(`Project Context: ${context.context}`)
	}

	if (context.constraints && context.constraints.length > 0) {
		parts.push(`User Constraints:\n${context.constraints.map(c => `- ${c}`).join('\n')}`)
	}

	if (context.tasks && context.tasks.length > 0) {
		const active_tasks = context.tasks.filter(t => t.status === 'processing' || t.status === 'pending')

		if (active_tasks.length > 0) {
			parts.push(`Active Tasks:\n${active_tasks.map(t => `- ${t.title}: ${t.desc}`).join('\n')}`)
		}
	}

	if (context.files && context.files.length > 0) {
		const recent_files = context.files.slice(-5)

		parts.push(`Recent Files:\n${recent_files.map(f => `- ${f.path} (${f.status || 'read'})`).join('\n')}`)
	}

	if (parts.length === 0) {
		return 'No explicit user intent in context'
	}

	return parts.join('\n\n')
}

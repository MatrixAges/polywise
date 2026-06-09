export interface AgentToolBinding {
	name: string
	enabled: boolean
}

const normalizeAgentToolName = (value: unknown) => {
	if (typeof value !== 'string') {
		return ''
	}

	return value.trim()
}

const normalizeAgentToolBinding = (value: unknown): AgentToolBinding | null => {
	if (typeof value === 'string') {
		const name = normalizeAgentToolName(value)

		return name ? { name, enabled: true } : null
	}

	if (!value || typeof value !== 'object' || Array.isArray(value)) {
		return null
	}

	const { name: raw_name, enabled: raw_enabled } = value as {
		name?: unknown
		enabled?: unknown
	}
	const name = normalizeAgentToolName(raw_name)

	if (!name) {
		return null
	}

	return {
		name,
		enabled: typeof raw_enabled === 'boolean' ? raw_enabled : true
	}
}

export const normalizeAgentTools = (value: unknown) => {
	if (!Array.isArray(value)) {
		return [] as Array<AgentToolBinding>
	}

	const binding_map = new Map<string, AgentToolBinding>()

	for (const item of value) {
		const binding = normalizeAgentToolBinding(item)

		if (!binding) {
			continue
		}

		binding_map.set(binding.name, binding)
	}

	return Array.from(binding_map.values())
}

export const getAgentToolNames = (value: unknown) => normalizeAgentTools(value).map(item => item.name)

export const getEnabledAgentToolNames = (value: unknown) =>
	normalizeAgentTools(value)
		.filter(item => item.enabled)
		.map(item => item.name)

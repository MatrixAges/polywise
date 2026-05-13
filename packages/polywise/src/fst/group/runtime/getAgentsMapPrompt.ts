import type Group from '../index'

export default (s: Group, args?: { include_description?: boolean }) => {
	if (!s.agents_map.length) {
		return ''
	}

	const include_description = args?.include_description ?? false
	const lines = [
		'# Group Agents Map',
		'The following lightweight member map is preloaded for routing decisions and awareness only.',
		'Do not use it to role-play, impersonate, quote, or simulate answers from other members.',
		'Do not produce a panel-style or whole-team answer unless the user explicitly asks for a multi-member synthesis.'
	]

	for (const agent of s.agents_map) {
		lines.push(
			`- ${agent.id}: ${agent.name} (${agent.role})${
				include_description && agent.description ? ` - ${agent.description}` : ''
			}`
		)
	}

	return lines.join('\n')
}

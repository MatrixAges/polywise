import type Group from '../index'

export default (s: Group) => {
	if (!s.agents_map.length) {
		return ''
	}

	const lines = [
		'# Group Agents Map',
		'The following lightweight member map is preloaded for routing decisions. Use deeper profile data only when needed.'
	]

	for (const agent of s.agents_map) {
		lines.push(
			`- ${agent.id}: ${agent.name} (${agent.role})${agent.description ? ` - ${agent.description}` : ''}`
		)
	}

	return lines.join('\n')
}

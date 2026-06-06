import type { PthinkReviewGroup, PthinkReviewWindow } from './types'

const getGroupKey = (args: { scope_type: 'global' | 'agent' | 'project'; scope_id: string | null }) => {
	const { scope_type, scope_id } = args

	if (scope_type === 'agent' && scope_id) {
		return `agent:${scope_id}`
	}

	if (scope_type === 'project' && scope_id) {
		return `project:${scope_id}`
	}

	return 'global'
}

const getGroupLabel = (args: { scope_type: 'global' | 'agent' | 'project'; scope_id: string | null }) => {
	const { scope_type, scope_id } = args

	if (scope_type === 'agent') {
		return scope_id ? `Agent ${scope_id}` : 'Agent'
	}

	if (scope_type === 'project') {
		return scope_id ? `Project ${scope_id}` : 'Project'
	}

	return 'Global'
}

export default (window: PthinkReviewWindow) => {
	const group_map = new Map<string, PthinkReviewGroup>()

	for (const message_item of window.messages) {
		const scope_type = message_item.session_scope_type
		const scope_id = message_item.session_scope_id
		const group_key = getGroupKey({
			scope_type,
			scope_id
		})
		const current_group = group_map.get(group_key) ?? {
			key: group_key,
			label: getGroupLabel({
				scope_type,
				scope_id
			}),
			scope_type,
			scope_id,
			session_ids: [],
			session_titles: [],
			message_count: 0,
			messages: []
		}

		if (!current_group.session_ids.includes(message_item.session_id)) {
			current_group.session_ids.push(message_item.session_id)
		}

		if (message_item.session_title && !current_group.session_titles.includes(message_item.session_title)) {
			current_group.session_titles.push(message_item.session_title)
		}

		current_group.messages.push(message_item)
		current_group.message_count += 1
		group_map.set(group_key, current_group)
	}

	return Array.from(group_map.values()).sort((a, b) => {
		if (b.message_count !== a.message_count) {
			return b.message_count - a.message_count
		}

		return a.label.localeCompare(b.label)
	})
}

import { renderHelpTree, root_help_id } from '../shared/help'
import { page_map } from './registry'

import type { HelpNode } from '../types'

export const getPageHelpTree = () => {
	const tree = {
		[root_help_id]: {
			id: root_help_id,
			title: 'page',
			summary: 'Frontend page and panel index with progressive disclosure.',
			kind: 'root',
			children: ['group:route', 'group:panel'],
			hints: ['Use `page current` for runtime state or `page <route|panel> -h` for index details.']
		},
		'group:route': {
			id: 'group:route',
			title: 'route',
			summary: 'Application routes.',
			kind: 'group',
			children: [],
			hints: ['Use `page route -h` to inspect route entries.']
		},
		'group:panel': {
			id: 'group:panel',
			title: 'panel',
			summary: 'Global panel tabs.',
			kind: 'group',
			children: [],
			hints: ['Use `page panel -h` to inspect panel entries.']
		}
	} as Record<string, HelpNode>

	for (const item of page_map) {
		const parent_id = item.kind === 'route' ? 'group:route' : 'group:panel'

		tree[parent_id].children!.push(item.id)
		tree[item.id] = {
			id: item.id,
			title: item.kind === 'panel' ? item.panel_tab || item.id : item.id,
			summary: item.summary,
			kind: 'page',
			hints: item.params_hint.length ? [`Params: ${item.params_hint.join(', ')}`] : []
		}
	}

	return tree
}

export const renderPageHelp = (path: Array<string>) => renderHelpTree(getPageHelpTree(), path)

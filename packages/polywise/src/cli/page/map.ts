import { renderHelpTree, root_help_id } from '../shared/help'

import type { HelpNode, PageMapItem } from '../types'

export const page_map: Array<PageMapItem> = [
	{
		id: 'home',
		kind: 'route',
		title: 'home',
		summary: 'Dashboard route with global system overview.',
		route_path: '/',
		params_hint: []
	},
	{
		id: 'session',
		kind: 'route',
		title: 'session',
		summary: 'Session route for browsing and operating chat sessions.',
		route_path: '/session',
		params_hint: []
	},
	{
		id: 'agent',
		kind: 'route',
		title: 'agent',
		summary: 'Agent route for browsing and editing agents.',
		route_path: '/agent',
		params_hint: []
	},
	{
		id: 'linkcase',
		kind: 'route',
		title: 'linkcase',
		summary: 'Linkcase route for fetched links and batch tasks.',
		route_path: '/linkcase',
		params_hint: []
	},
	{
		id: 'post',
		kind: 'route',
		title: 'post',
		summary: 'Post list route for browsing generated posts.',
		route_path: '/post',
		params_hint: []
	},
	{
		id: 'post.detail',
		kind: 'route',
		title: 'post.detail',
		summary: 'Post detail route for a single post.',
		route_path: '/post/:id',
		params_hint: ['id']
	},
	{
		id: 'setting',
		kind: 'route',
		title: 'setting',
		summary: 'Settings route entry.',
		route_path: '/setting',
		params_hint: []
	},
	{
		id: 'setting.general',
		kind: 'route',
		title: 'setting.general',
		summary: 'General settings tab.',
		route_path: '/setting',
		params_hint: []
	},
	{
		id: 'setting.model_provider',
		kind: 'route',
		title: 'setting.model_provider',
		summary: 'Model provider settings tab.',
		route_path: '/setting/model_provider',
		params_hint: []
	},
	{
		id: 'setting.model_setting',
		kind: 'route',
		title: 'setting.model_setting',
		summary: 'Model setting route.',
		route_path: '/setting/model_setting',
		params_hint: []
	},
	{
		id: 'setting.oauth_provider',
		kind: 'route',
		title: 'setting.oauth_provider',
		summary: 'OAuth provider settings route.',
		route_path: '/setting/oauth_provider',
		params_hint: []
	},
	{
		id: 'setting.service_provider',
		kind: 'route',
		title: 'setting.service_provider',
		summary: 'Service provider settings route.',
		route_path: '/setting/service_provider',
		params_hint: []
	},
	{
		id: 'setting.im',
		kind: 'route',
		title: 'setting.im',
		summary: 'IM settings route.',
		route_path: '/setting/im',
		params_hint: []
	},
	{
		id: 'setting.about_feedback',
		kind: 'route',
		title: 'setting.about_feedback',
		summary: 'About and feedback settings route.',
		route_path: '/setting/about_feedback',
		params_hint: []
	},
	{
		id: 'panel.session',
		kind: 'panel',
		title: 'panel.session',
		summary: 'Global panel session tab.',
		panel_tab: 'session',
		params_hint: []
	},
	{
		id: 'panel.bookmark',
		kind: 'panel',
		title: 'panel.bookmark',
		summary: 'Global panel bookmark tab.',
		panel_tab: 'bookmark',
		params_hint: []
	},
	{
		id: 'panel.pipeline',
		kind: 'panel',
		title: 'panel.pipeline',
		summary: 'Global panel pipeline tab.',
		panel_tab: 'pipeline',
		params_hint: []
	},
	{
		id: 'panel.notification',
		kind: 'panel',
		title: 'panel.notification',
		summary: 'Global panel notification tab.',
		panel_tab: 'notification',
		params_hint: []
	}
] satisfies Array<PageMapItem>

export const page_map_by_id = new Map(page_map.map(item => [item.id, item]))

const matchRouteTemplate = (template: string, pathname: string) => {
	if (template === pathname) {
		return true
	}

	const template_parts = template.split('/').filter(Boolean)
	const pathname_parts = pathname.split('/').filter(Boolean)

	if (template_parts.length !== pathname_parts.length) {
		return false
	}

	return template_parts.every((part, index) => part.startsWith(':') || part === pathname_parts[index])
}

export const resolvePageByPathname = (pathname: string) => {
	const exact = page_map.find(item => item.kind === 'route' && item.route_path === pathname)

	if (exact) {
		return exact
	}

	return (
		page_map.find(
			item => item.kind === 'route' && item.route_path && matchRouteTemplate(item.route_path, pathname)
		) || null
	)
}

export const buildRoutePath = (id: string, params: Record<string, string> = {}) => {
	const item = page_map_by_id.get(id)

	if (!item || item.kind !== 'route' || !item.route_path) {
		return null
	}

	return item.route_path.replace(/:([A-Za-z0-9_]+)/g, (_match: string, key: string) => params[key] ?? `:${key}`)
}

export const getPageHelpTree = () => {
	const tree = {
		[root_help_id]: {
			id: root_help_id,
			title: 'page',
			summary: 'Frontend page and panel index with progressive disclosure.',
			kind: 'root',
			children: ['group:route', 'group:panel'],
			hints: [
				'Use page_tool action `current` for runtime state or action `help` with path `["route"]` / `["panel"]` for index details.'
			]
		},
		'group:route': {
			id: 'group:route',
			title: 'route',
			summary: 'Application routes.',
			kind: 'group',
			children: [],
			hints: ['Use page_tool action `help` with path `["route"]` to inspect route entries.']
		},
		'group:panel': {
			id: 'group:panel',
			title: 'panel',
			summary: 'Global panel tabs.',
			kind: 'group',
			children: [],
			hints: ['Use page_tool action `help` with path `["panel"]` to inspect panel entries.']
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

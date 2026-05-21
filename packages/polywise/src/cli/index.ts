#!/usr/bin/env node
import { pathToFileURL } from 'node:url'
import { command, number, positional, run, string } from '@drizzle-team/brocli'

import { getApiMap, renderApiHelp } from './api/map'
import { renderPageHelp } from './page/map'
import { buildRoutePath, page_map, page_map_by_id } from './page/registry'

import type { ApiMapItem, PageMapItem, RenderedHelp } from './types'

const cli_version = '0.0.1'
const server_base_url = (process.env.POLYWISE_SERVER_URL || 'http://localhost:3072').replace(/\/$/, '')
const api_base_url = `${server_base_url}/api`
const sys_base_url = `${server_base_url}/sys`

type JsonLike = Record<string, unknown>

interface PageStatePayload {
	page_map: Array<PageMapItem>
	runtime: {
		snapshot: {
			page_id: string | null
			route_page_id: string | null
			panel: {
				page_id: string | null
			}
			visible_sections: Array<{ id: string; title: string }>
		} | null
		last_sync_at: number | null
		last_sync_age_ms: number | null
		bridge_online: boolean
		ack_seq: number
		pending_count: number
	}
}

interface ApiCommandTreeNode {
	name: string
	path: Array<string>
	children: Map<string, ApiCommandTreeNode>
	item: ApiMapItem | null
}

const printJson = (value: unknown) => {
	process.stdout.write(`${JSON.stringify(value, null, 2)}\n`)
}

const printText = (value: string) => {
	process.stdout.write(`${value}\n`)
}

const toHelpText = (title: string, data: RenderedHelp | null) => {
	if (!data) {
		return `${title}: not found`
	}

	return [
		`${title} ${data.path.join(' ')}`.trim(),
		data.summary,
		...(data.hints || []).map(item => `- ${item}`),
		...(data.items || []).map(item => `- ${item.title}: ${item.summary}`),
		...(data.examples || []).map(item => `example: ${item}`)
	]
		.filter(Boolean)
		.join('\n')
}

const printRenderedHelp = (title: string, data: RenderedHelp | null) => {
	printText(toHelpText(title, data))
}

const resolveApiPath = (path: string, input: Record<string, unknown>) => {
	const rest = { ...input }
	const resolved_path = path.replace(/\{([A-Za-z0-9_]+)\}/g, (_, key: string) => {
		const value = rest[key]

		delete rest[key]

		return encodeURIComponent(String(value ?? `{${key}}`))
	})

	return {
		resolved_path,
		rest
	}
}

const readResponseBody = async (response: Response) => {
	const text = await response.text()

	try {
		return JSON.parse(text)
	} catch {
		return text
	}
}

const callApi = async (target: ApiMapItem, input: Record<string, unknown>) => {
	const { resolved_path, rest } = resolveApiPath(target.openapi_path, input)
	const url = new URL(resolved_path, api_base_url)
	const is_query_method = target.method === 'GET' || target.method === 'DELETE'

	if (is_query_method) {
		for (const [key, value] of Object.entries(rest)) {
			url.searchParams.set(key, String(value))
		}
	}

	const response = await fetch(url, {
		method: target.method,
		headers: {
			'content-type': 'application/json'
		},
		...(is_query_method ? {} : { body: JSON.stringify(rest) })
	})

	printJson({
		ok: response.ok,
		status: response.status,
		method: target.method,
		path: target.openapi_path,
		data: await readResponseBody(response)
	})
}

const getPageState = async (): Promise<PageStatePayload> => {
	const response = await fetch(`${sys_base_url}/page`)

	return response.json()
}

const postPageCommand = async (payload: JsonLike) => {
	const response = await fetch(`${sys_base_url}/page/command`, {
		method: 'POST',
		headers: {
			'content-type': 'application/json'
		},
		body: JSON.stringify(payload)
	})

	printJson(await readResponseBody(response))
}

const renderApiCommandHelpText = (item: ApiMapItem) =>
	[
		item.cli_path.join(' '),
		item.summary,
		`${item.method} ${item.openapi_path}`,
		item.description || '',
		...(item.parameters.length
			? [
					'parameters:',
					...item.parameters.map(
						param =>
							`- ${param.name}: ${param.in} ${param.type}${param.required ? ' required' : ''}`
					)
				]
			: ['parameters: none']),
		...(item.examples.length ? item.examples.map(example => `example: ${example}`) : [])
	]
		.filter(Boolean)
		.join('\n')

const renderPageItemHelpText = (item: PageMapItem, command_path?: string) =>
	[
		command_path || `page ${item.kind} ${item.id}`,
		item.summary,
		item.kind === 'route' ? `route: ${item.route_path || 'n/a'}` : `panel tab: ${item.panel_tab || 'n/a'}`,
		item.params_hint.length ? `params: ${item.params_hint.join(', ')}` : 'params: none'
	]
		.filter(Boolean)
		.join('\n')

const createApiOptionBuilder = (parameter: ApiMapItem['parameters'][number]) => {
	let option: any

	switch (parameter.type) {
		case 'integer':
			option = number(parameter.name).int()
			break
		case 'number':
			option = number(parameter.name)
			break
		case 'boolean':
			option = string(parameter.name).enum('true', 'false')
			break
		default:
			option = string(parameter.name)
			break
	}

	option = option.desc(`${parameter.in} ${parameter.type}${parameter.required ? ' required' : ''}`)

	if (parameter.required) {
		option = option.required()
	}

	return option
}

const normalizeApiOptionValue = (
	parameter: ApiMapItem['parameters'][number],
	value: string | number | boolean | undefined
) => {
	if (value === undefined) {
		return undefined
	}

	if (parameter.type === 'boolean') {
		return value === true || value === 'true'
	}

	if ((parameter.type === 'object' || parameter.type === 'array') && typeof value === 'string') {
		try {
			return JSON.parse(value)
		} catch {
			return value
		}
	}

	return value
}

const createApiCommandOptions = (item: ApiMapItem) => {
	if (!item.parameters.length) {
		return undefined
	}

	return Object.fromEntries(item.parameters.map(parameter => [parameter.name, createApiOptionBuilder(parameter)]))
}

const buildApiInput = (item: ApiMapItem, options: Record<string, string | number | boolean | undefined>) =>
	Object.fromEntries(
		item.parameters
			.map(
				parameter =>
					[parameter.name, normalizeApiOptionValue(parameter, options[parameter.name])] as const
			)
			.filter(([, value]) => value !== undefined)
	)

const createApiTree = () => {
	const root: ApiCommandTreeNode = {
		name: 'api',
		path: [],
		children: new Map(),
		item: null
	}

	for (const item of getApiMap()) {
		let current = root
		const segments = [...item.group_path, item.cli_path.at(-1) || item.rpc_path]

		for (const segment of segments) {
			if (!current.children.has(segment)) {
				current.children.set(segment, {
					name: segment,
					path: [...current.path, segment],
					children: new Map(),
					item: null
				})
			}

			current = current.children.get(segment)!
		}

		current.item = item
	}

	return root
}

const buildApiCommands = (node: ApiCommandTreeNode): Array<any> =>
	Array.from(node.children.values())
		.sort((left, right) => left.name.localeCompare(right.name))
		.map(child => {
			const item = child.item
			const has_children = child.children.size > 0

			if (item && !has_children) {
				return command({
					name: child.name,
					desc: item.summary,
					shortDesc: item.summary,
					options: createApiCommandOptions(item) as any,
					help: () => {
						printText(renderApiCommandHelpText(item))
					},
					handler: async (options: Record<string, string | number | boolean | undefined>) => {
						await callApi(item, buildApiInput(item, options || {}))
					}
				})
			}

			return command({
				name: child.name,
				desc: `${child.path.join('.')} API group`,
				shortDesc: `${child.path.join('.')} API group`,
				help: () => {
					printRenderedHelp('api', renderApiHelp(child.path))
				},
				subcommands: buildApiCommands(child) as any
			})
		})

const createPageNavigateOptions = (item: PageMapItem) => {
	if (!item.params_hint.length) {
		return undefined
	}

	return Object.fromEntries(item.params_hint.map(param => [param, string(param).required()]))
}

const createPageNavigateCommand = (item: PageMapItem, name: string) =>
	command({
		name,
		desc: item.summary,
		shortDesc: item.summary,
		options: createPageNavigateOptions(item) as any,
		help: () => {
			printText(renderPageItemHelpText(item, `page navigate ${item.kind} ${name}`))
		},
		handler: async (options: Record<string, string | undefined>) => {
			if (item.kind === 'panel') {
				await postPageCommand({
					type: 'panel',
					target: item.panel_tab
				})
				return
			}

			const params = Object.fromEntries(
				Object.entries(options || {}).filter(([, value]) => typeof value === 'string' && value.length)
			) as Record<string, string>
			const route_target = buildRoutePath(item.id, params) || item.route_path || ''

			if (/:([A-Za-z0-9_]+)/.test(route_target)) {
				throw new Error(`Missing required route params for ${item.id}`)
			}

			await postPageCommand({
				type: 'navigate',
				target: route_target,
				params
			})
		}
	})

const createPageInfoCommand = (item: PageMapItem, name: string) =>
	command({
		name,
		desc: item.summary,
		shortDesc: item.summary,
		help: () => {
			printText(renderPageItemHelpText(item, `page ${item.kind} ${name}`))
		},
		handler: () => {
			printText(renderPageItemHelpText(item, `page ${item.kind} ${name}`))
		}
	})

const route_items = page_map
	.filter(item => item.kind === 'route')
	.sort((left, right) => left.id.localeCompare(right.id))
const panel_items = page_map
	.filter(item => item.kind === 'panel')
	.sort((left, right) => left.id.localeCompare(right.id))

const inspectPageState = (state: PageStatePayload, target: string) => {
	const snapshot = state.runtime.snapshot

	if (!snapshot) {
		return {
			error: 'No page runtime snapshot has been reported by the app bridge yet.'
		}
	}

	if (!target) {
		return snapshot
	}

	const page_target = page_map_by_id.get(target) || panel_items.find(item => item.panel_tab === target) || null
	const resolved_target_id = page_target?.id || target

	return {
		target: page_target || null,
		current_route_page: snapshot.route_page_id,
		current_panel_page: snapshot.panel.page_id,
		current_snapshot: snapshot,
		matches_current_page:
			snapshot.route_page_id === resolved_target_id || snapshot.panel.page_id === resolved_target_id,
		section:
			snapshot.visible_sections.find(section => section.id === target) ||
			snapshot.visible_sections.find(section => section.title === target) ||
			null
	}
}

const page_command = command({
	name: 'page',
	desc: 'Frontend page and panel CLI.',
	shortDesc: 'Frontend page and panel CLI.',
	help: () => {
		printRenderedHelp('page', renderPageHelp([]))
	},
	subcommands: [
		command({
			name: 'current',
			desc: 'Show current runtime page snapshot.',
			shortDesc: 'Show current runtime page snapshot.',
			handler: async () => {
				const state = await getPageState()
				printJson(state.runtime)
			}
		}),
		command({
			name: 'list',
			desc: 'List registered routes and panel pages.',
			shortDesc: 'List registered routes and panel pages.',
			handler: () => {
				printJson({
					count: page_map.length,
					routes: route_items.map(item => ({
						id: item.id,
						summary: item.summary,
						route_path: item.route_path || null
					})),
					panels: panel_items.map(item => ({
						id: item.id,
						summary: item.summary,
						panel_tab: item.panel_tab || null
					}))
				})
			}
		}),
		command({
			name: 'inspect',
			desc: 'Inspect the current runtime snapshot or a target section/page id.',
			shortDesc: 'Inspect the current runtime snapshot or a target section/page id.',
			options: {
				target: positional('target').desc('Page id or visible section id/title').default('')
			} as any,
			handler: async (options: { target: string }) => {
				const state = await getPageState()
				printJson(inspectPageState(state, options.target))
			}
		}),
		command({
			name: 'back',
			desc: 'Request back navigation in the app runtime.',
			shortDesc: 'Request back navigation in the app runtime.',
			handler: async () => {
				await postPageCommand({ type: 'back' })
			}
		}),
		command({
			name: 'navigate',
			desc: 'Navigate to a concrete route or panel target.',
			shortDesc: 'Navigate to a concrete route or panel target.',
			help: () => {
				printText(
					[
						'page navigate',
						'Use `page navigate route -h` or `page navigate panel -h` for the next level.'
					].join('\n')
				)
			},
			subcommands: [
				command({
					name: 'route',
					desc: 'Navigate to registered routes.',
					shortDesc: 'Navigate to registered routes.',
					help: () => {
						printRenderedHelp('page', renderPageHelp(['route']))
					},
					subcommands: route_items.map(item => createPageNavigateCommand(item, item.id)) as any
				}),
				command({
					name: 'panel',
					desc: 'Navigate to global panel tabs.',
					shortDesc: 'Navigate to global panel tabs.',
					help: () => {
						printRenderedHelp('page', renderPageHelp(['panel']))
					},
					subcommands: panel_items.map(item =>
						createPageNavigateCommand(item, item.panel_tab || item.id)
					) as any
				})
			] as any
		}),
		command({
			name: 'route',
			desc: 'Inspect registered routes.',
			shortDesc: 'Inspect registered routes.',
			help: () => {
				printRenderedHelp('page', renderPageHelp(['route']))
			},
			subcommands: route_items.map(item => createPageInfoCommand(item, item.id)) as any
		}),
		command({
			name: 'panel',
			desc: 'Inspect registered panel tabs.',
			shortDesc: 'Inspect registered panel tabs.',
			help: () => {
				printRenderedHelp('page', renderPageHelp(['panel']))
			},
			subcommands: panel_items.map(item => createPageInfoCommand(item, item.panel_tab || item.id)) as any
		})
	] as any
})

const api_tree = createApiTree()
const api_command = command({
	name: 'api',
	desc: 'Backend API CLI with progressive disclosure.',
	shortDesc: 'Backend API CLI with progressive disclosure.',
	help: () => {
		printRenderedHelp('api', renderApiHelp([]))
	},
	subcommands: buildApiCommands(api_tree) as any
})

export const main = async () => {
	await run([api_command, page_command] as any, {
		name: 'polywise',
		description: 'Polywise CLI',
		version: cli_version,
		omitKeysOfUndefinedOptions: true,
		help: () => {
			printText(
				[
					'polywise cli',
					'use: polywise api -h',
					'use: polywise page -h',
					'optional env: POLYWISE_SERVER_URL=http://localhost:3072'
				].join('\n')
			)
		}
	})
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
	main().catch(error => {
		const message = error instanceof Error ? error.message : String(error)
		process.stderr.write(`${message}\n`)
		process.exitCode = 1
	})
}

export default main

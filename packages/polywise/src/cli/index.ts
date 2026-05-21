#!/usr/bin/env node
import { pathToFileURL } from 'node:url'
import { command, number, run, string } from '@drizzle-team/brocli'

import { getApiMap, renderApiHelp } from './api/map'

import type { ApiMapItem, RenderedHelp } from './types'

const cli_version = '0.0.1'
const server_base_url = (process.env.POLYWISE_SERVER_URL || 'http://localhost:3072').replace(/\/$/, '')
const api_base_url = `${server_base_url}/api`

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

const buildApiUrl = (path: string) => new URL(path.replace(/^\//, ''), `${api_base_url}/`)

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
	const url = buildApiUrl(resolved_path)
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
	await run([api_command] as any, {
		name: 'polywise',
		description: 'Polywise CLI',
		version: cli_version,
		omitKeysOfUndefinedOptions: true,
		help: () => {
			printText(
				[
					'polywise cli',
					'use: polywise api -h',
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

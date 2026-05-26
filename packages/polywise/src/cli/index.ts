#!/usr/bin/env node
import { spawn } from 'child_process'
import { closeSync, openSync } from 'fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import path from 'path'
import { logs_dir, runtime_pid_path } from '@core/consts/app'
import { boolean, command, number, run, string } from '@drizzle-team/brocli'
import fs from 'fs-extra'

import { getRuntimeCommandEnv } from '../utils/resolveCommand'
import { polywise_version } from '../version'
import { getApiMap, renderApiHelp } from './api/map'

import type { ApiMapItem, RenderedHelp } from './types'

const server_base_url = (process.env.POLYWISE_SERVER_URL || 'http://localhost:3072').replace(/\/$/, '')
const api_base_url = `${server_base_url}/api`
const server_entrypoint_path = fileURLToPath(new URL('../index.js', import.meta.url))
const version_flags = new Set(['-v', '--version'])

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

const toCliText = (value: string) =>
	value
		.replace(/`api /g, '`')
		.replace(/\bpolywise api\b/g, 'polywise')
		.replace(/^api\b/, 'polywise')

const toCliHelp = (data: RenderedHelp | null): RenderedHelp | null => {
	if (!data) {
		return null
	}

	return {
		...data,
		title: data.title === 'api' ? 'polywise' : data.title,
		summary: toCliText(data.summary),
		items: data.items.map(item => ({
			...item,
			summary: toCliText(item.summary)
		})),
		hints: data.hints.map(toCliText),
		examples: data.examples.map(toCliText)
	}
}

const printRenderedCliHelp = (data: RenderedHelp | null) => {
	printRenderedHelp('polywise', toCliHelp(data))
}

const renderRootCliHelp = () => {
	const data = toCliHelp(renderApiHelp([]))

	if (!data) {
		return null
	}

	return {
		...data,
		summary: 'Polywise CLI for starting the local server and calling the backend API.',
		hints: [
			'Use `polywise start` to run the local server.',
			'Use `polywise start -d` to run it in the background.',
			...data.hints
		],
		items: [
			{
				key: 'start',
				title: 'start',
				summary: 'Start the Polywise server',
				kind: 'command' as const
			},
			...data.items
		]
	}
}

const shouldPrintVersion = (argv: Array<string>) => argv.length === 1 && version_flags.has(argv[0] || '')

const readRuntimePid = async () => {
	try {
		const raw = await fs.readFile(runtime_pid_path, 'utf8')
		const pid = Number.parseInt(raw.trim(), 10)

		return Number.isFinite(pid) && pid > 0 ? pid : null
	} catch {
		return null
	}
}

const isProcessAlive = (pid: number) => {
	try {
		process.kill(pid, 0)
		return true
	} catch {
		return false
	}
}

const getActiveRuntimePid = async () => {
	const pid = await readRuntimePid()

	if (!pid) {
		return null
	}

	if (isProcessAlive(pid)) {
		return pid
	}

	await fs.remove(runtime_pid_path).catch(() => null)

	return null
}

const startDetachedServer = async () => {
	const active_pid = await getActiveRuntimePid()

	if (active_pid) {
		printJson({
			ok: true,
			action: 'start',
			detached: true,
			already_running: true,
			pid: active_pid
		})
		return
	}

	let log_path: string | null = null
	let log_fd: number | null = null

	try {
		await fs.ensureDir(logs_dir)
		log_path = path.resolve(logs_dir, 'server.log')
		log_fd = openSync(log_path, 'a')
	} catch {
		log_path = null
		log_fd = null
	}

	const child = spawn(process.execPath, [server_entrypoint_path], {
		detached: true,
		stdio: log_fd == null ? 'ignore' : ['ignore', log_fd, log_fd],
		env: getRuntimeCommandEnv()
	})

	child.unref()

	if (log_fd != null) {
		closeSync(log_fd)
	}

	printJson({
		ok: true,
		action: 'start',
		detached: true,
		already_running: false,
		pid: child.pid ?? null,
		log_path
	})
}

const startForegroundServer = async () => {
	const active_pid = await getActiveRuntimePid()

	if (active_pid) {
		printJson({
			ok: true,
			action: 'start',
			detached: false,
			already_running: true,
			pid: active_pid
		})
		return
	}

	printText('Starting Polywise server...')

	await import('../index')
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
		['polywise', ...item.cli_path.slice(1)].join(' '),
		item.summary,
		`${item.method} ${item.openapi_path}`,
		item.description || '',
		'fallback:',
		`- --json '{"key":"value"}'`,
		...(item.parameters.length
			? [
					'parameters:',
					...item.parameters.map(
						param =>
							`- ${param.name}: ${param.in} ${param.type}${param.required ? ' required' : ''}`
					)
				]
			: ['parameters: none']),
		...(item.examples.length ? item.examples.map(example => `example: ${toCliText(example)}`) : [])
	]
		.filter(Boolean)
		.join('\n')

const parseJsonOption = (value: string | undefined) => {
	if (!value) {
		return {}
	}

	const parsed = JSON.parse(value)

	if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') {
		throw new Error('--json must be a JSON object')
	}

	return parsed as Record<string, unknown>
}

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
	const parameter_options = Object.fromEntries(
		item.parameters.map(parameter => [parameter.name, createApiOptionBuilder(parameter)])
	)

	return {
		json: string('json').desc('JSON object input payload'),
		...parameter_options
	}
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
					handler: async (
						options: Record<string, string | number | boolean | undefined> & {
							json?: string
						}
					) => {
						const json_input = parseJsonOption(options?.json)
						const scalar_input = buildApiInput(item, options || {})

						await callApi(item, {
							...json_input,
							...scalar_input
						})
					}
				})
			}

			return command({
				name: child.name,
				desc: `${child.path.join('.')} API group`,
				shortDesc: `${child.path.join('.')} API group`,
				help: () => {
					printRenderedCliHelp(renderApiHelp(child.path))
				},
				subcommands: buildApiCommands(child) as any
			})
		})

const api_tree = createApiTree()
const start_command = command({
	name: 'start',
	desc: 'Start the Polywise server',
	shortDesc: 'Start the Polywise server',
	options: {
		detach: boolean().alias('d').desc('Run in the background and exit immediately').default(false)
	},
	help: () => {
		printText(
			[
				'polywise start',
				'Start the Polywise server.',
				'options:',
				'- --detach, -d: Run in the background and exit immediately',
				'example: polywise start',
				'example: polywise start -d'
			].join('\n')
		)
	},
	handler: async (options: { detach?: boolean }) => {
		if (options.detach) {
			await startDetachedServer()
			return
		}

		await startForegroundServer()
	}
})
const root_commands = [start_command, ...buildApiCommands(api_tree)]

export const main = async (argv = process.argv.slice(2)) => {
	if (shouldPrintVersion(argv)) {
		printText(polywise_version)
		return
	}

	await run(root_commands as any, {
		name: 'polywise',
		description: 'Polywise CLI',
		version: polywise_version,
		omitKeysOfUndefinedOptions: true,
		help: () => {
			printRenderedCliHelp(renderRootCliHelp())
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

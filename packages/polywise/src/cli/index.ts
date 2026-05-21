#!/usr/bin/env node
import { pathToFileURL } from 'node:url'

import { getApiMap, getApiMapItem, renderApiHelp } from './api/map'
import { renderPageHelp } from './page/map'
import { buildRoutePath, page_map_by_id } from './page/registry'

const server_base_url = 'http://localhost:3072'
const api_base_url = `${server_base_url}/api`
const sys_base_url = `${server_base_url}/sys`

const isTruthy = (value: string) => !['false', '0', 'no', 'off'].includes(value.toLowerCase())

const parseValue = (value: string) => {
	if (value === 'true' || value === 'false') {
		return value === 'true'
	}

	if (/^-?\d+(\.\d+)?$/.test(value)) {
		return Number(value)
	}

	return value
}

const parseArgv = (argv: Array<string>) => {
	const positional: Array<string> = []
	const options: Record<string, string | number | boolean> = {}

	for (let index = 0; index < argv.length; index += 1) {
		const token = argv[index]

		if (token === '--') {
			positional.push(...argv.slice(index + 1))
			break
		}

		if (token.startsWith('--')) {
			const key = token.slice(2)
			const next = argv[index + 1]

			if (!next || next.startsWith('-')) {
				options[key] = true
				continue
			}

			options[key] = parseValue(next)
			index += 1
			continue
		}

		if (token.startsWith('-') && token.length > 1) {
			for (const flag of token.slice(1).split('')) {
				options[flag] = true
			}
			continue
		}

		positional.push(token)
	}

	return { positional, options }
}

const printJson = (value: unknown) => {
	process.stdout.write(`${JSON.stringify(value, null, 2)}\n`)
}

const printText = (value: string) => {
	process.stdout.write(`${value}\n`)
}

const renderHelp = (
	title: string,
	data: ReturnType<typeof renderApiHelp> | ReturnType<typeof renderPageHelp> | null
) => {
	if (!data) {
		printText(`${title}: not found`)
		return
	}

	const lines = [
		`${title} ${data.path.join(' ')}`.trim(),
		data.summary,
		...(data.hints || []).map(item => `- ${item}`),
		...(data.items || []).map(item => `- ${item.title}: ${item.summary}`),
		...(data.examples || []).map(item => `example: ${item}`)
	]

	printText(lines.filter(Boolean).join('\n'))
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

const callApi = async (target: ReturnType<typeof getApiMapItem>, input: Record<string, unknown>) => {
	if (!target) {
		throw new Error('API target not found')
	}

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
	const text = await response.text()

	try {
		printJson(JSON.parse(text))
	} catch {
		printText(text)
	}
}

const runApi = async (argv: Array<string>) => {
	const { positional, options } = parseArgv(argv)
	const help_index = positional.indexOf('-h')

	if (help_index >= 0 || options.h || options.help) {
		renderHelp('api', renderApiHelp(positional.slice(0, help_index >= 0 ? help_index : positional.length)))
		return
	}

	if (!positional.length) {
		renderHelp('api', renderApiHelp([]))
		return
	}

	const target = getApiMap().find(item => item.cli_path.slice(1).join(' ') === positional.join(' '))

	if (!target) {
		throw new Error(`Unknown api command: ${positional.join(' ')}`)
	}

	await callApi(target, options)
}

const getCurrentPage = async () => {
	const res = await fetch(`${sys_base_url}/page`)
	return res.json()
}

const runPage = async (argv: Array<string>) => {
	const { positional, options } = parseArgv(argv)

	if (options.h || options.help || positional.includes('-h')) {
		renderHelp('page', renderPageHelp(positional.filter(item => item !== '-h')))
		return
	}

	const action = positional[0] || 'current'

	if (action === 'current' || action === 'list') {
		printJson(await getCurrentPage())
		return
	}

	if (action === 'inspect') {
		const res = await getCurrentPage()
		const target = positional[1] || String(options.target || '')
		const snapshot = res.runtime?.snapshot || null

		printJson({
			target,
			snapshot,
			match:
				snapshot &&
				(target === snapshot.page_id ||
					snapshot.visible_sections.some(
						(section: { id: string; title: string }) =>
							section.id === target || section.title === target
					))
		})
		return
	}

	if (action === 'back' || action === 'navigate') {
		const target = positional[1] || String(options.target || '')
		const params = Object.fromEntries(
			Object.entries(options).filter(([key]) => !['h', 'help', 'target'].includes(key))
		)

		if (action === 'back') {
			await fetch(`${sys_base_url}/page/command`, {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ type: 'back' })
			})
			printJson({ queued: true, type: 'back' })
			return
		}

		const page = page_map_by_id.get(target)

		if (!page) {
			throw new Error(`Unknown page target: ${target}`)
		}
		const string_params = Object.fromEntries(Object.entries(params).map(([key, value]) => [key, String(value)]))

		const route_target =
			page.kind === 'panel' ? page.panel_tab : buildRoutePath(page.id, string_params) || page.route_path

		if (page.kind !== 'panel' && route_target && /:([A-Za-z0-9_]+)/.test(route_target)) {
			throw new Error(`Missing required route params for ${target}`)
		}

		await fetch(`${sys_base_url}/page/command`, {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({
				type: page.kind === 'panel' ? 'panel' : 'navigate',
				target: route_target,
				params: string_params
			})
		})
		printJson({ queued: true, target })
		return
	}

	throw new Error(`Unknown page command: ${action}`)
}

const runRoot = () => {
	printText(
		[
			'polywise cli',
			'use: polywise api <group> <command> [-h]',
			'use: polywise page <current|inspect|navigate|back> [-h]'
		].join('\n')
	)
}

export const main = async () => {
	const argv = process.argv.slice(2)
	const command = argv[0]

	if (!command || command === '-h' || command === '--help') {
		runRoot()
		return
	}

	if (command === 'api') {
		await runApi(argv.slice(1))
		return
	}

	if (command === 'page') {
		await runPage(argv.slice(1))
		return
	}

	runRoot()
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
	main().catch(error => {
		const message = error instanceof Error ? error.message : String(error)
		process.stderr.write(`${message}\n`)
		process.exitCode = 1
	})
}

export default main

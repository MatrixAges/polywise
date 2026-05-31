import { renderApiHelp } from '@core/cli/api/map'
import { tool } from 'ai'
import { array, boolean, number, object, record, string, union, enum as zod_enum } from 'zod'

import { executeApiTool } from './api'

import type { RenderedHelp } from '@core/cli/types'
import type { ApiToolInput } from './api'

const inputSchema = object({
	action: zod_enum(['help', 'list', 'input_schema', 'call']).default('help'),
	path: array(string()).optional().describe('Help path segments like ["api"] or ["cli", "start"].'),
	target: string()
		.optional()
		.describe('Target rpc path such as "session.create" for input_schema or call actions.'),
	keyword: string().optional().describe('Optional fuzzy keyword for list action.'),
	input: record(string(), union([string(), number(), boolean()]))
		.optional()
		.describe('Flat input object for call action. Values may be string, number, or boolean.')
})

const createHelpItem = (args: { key: string; title: string; summary: string }) => ({
	key: args.key,
	title: args.title,
	summary: args.summary,
	kind: 'group' as const
})

const renderRootHelp = (): RenderedHelp => ({
	path: [],
	title: 'polywise_tool',
	summary: 'Access Polywise from the global panel session. API execution is preferred because the local CLI is already a thin wrapper over the same backend endpoints.',
	items: [
		createHelpItem({
			key: 'api',
			title: 'api',
			summary: 'Browse and call Polywise backend APIs with progressive disclosure.'
		}),
		createHelpItem({
			key: 'cli',
			title: 'cli',
			summary: 'Read CLI-equivalent guidance. In-session execution still routes through the API surface.'
		})
	],
	hints: [
		'Use help path ["api"] first.',
		'When the target input is not already known, use action "input_schema" before any "call".',
		'Use help path ["cli"] to understand why this tool prefers API routing over shelling out to the polywise command.'
	],
	examples: [
		'polywise_tool help',
		'polywise_tool help api',
		'polywise_tool input_schema target session.create',
		'polywise_tool input_schema target agent.query',
		'polywise_tool call target session.getList'
	]
})

const renderCliRootHelp = (): RenderedHelp => ({
	path: ['cli'],
	title: 'cli',
	summary: 'The Polywise CLI mainly forwards local commands into the same backend API map. This tool keeps execution inside the current runtime and avoids exposing general shell access to the panel session.',
	items: [
		createHelpItem({
			key: 'input_schema',
			title: 'input_schema',
			summary: 'CLI command for reading a concrete RPC input schema before execution.'
		}),
		createHelpItem({
			key: 'start',
			title: 'start',
			summary: 'CLI-only server bootstrap command. It is not exposed here because this tool already runs inside the active Polywise service.'
		})
	],
	hints: [
		'For RPC-style work, inspect input_schema first, then call with a concrete target and flat input.',
		'If you need the raw CLI syntax, inspect the matching API target first; the behavior is effectively the same for exposed commands.'
	],
	examples: [
		'polywise_tool help cli input_schema',
		'polywise_tool help cli start',
		'polywise_tool list keyword session'
	]
})

const renderCliStartHelp = (): RenderedHelp => ({
	path: ['cli', 'start'],
	title: 'cli start',
	summary: 'Equivalent terminal command: "polywise start" or "polywise start -d". This action is intentionally not callable from polywise_tool because the tool only exists after the server is already running.',
	items: [],
	hints: [
		'Use the desktop app or terminal to bootstrap the service. Use polywise_tool for in-process API work after startup.'
	],
	examples: ['polywise start', 'polywise start -d', 'polywise_tool help api']
})

const renderCliInputSchemaHelp = (): RenderedHelp => ({
	path: ['cli', 'input_schema'],
	title: 'cli input_schema',
	summary: 'Equivalent terminal command: "polywise input_schema <rpc_path>". Use it to inspect parameter shape before calling an unfamiliar Polywise API.',
	items: [],
	hints: [
		'Mirror this flow in-tool with action "input_schema" before action "call".',
		'Prefer schema inspection after any call failure caused by missing or wrong parameters.'
	],
	examples: [
		'polywise input_schema session.create',
		'polywise input_schema agent.query',
		'polywise_tool input_schema target agent.query'
	]
})

const renderCliHelp = (path: Array<string>): RenderedHelp | null => {
	if (path.length === 0) {
		return renderCliRootHelp()
	}

	if (path.length === 1 && path[0] === 'start') {
		return renderCliStartHelp()
	}

	if (path.length === 1 && path[0] === 'input_schema') {
		return renderCliInputSchemaHelp()
	}

	return null
}

const renderPolywiseHelp = (path: Array<string>) => {
	if (path.length === 0) {
		return renderRootHelp()
	}

	const [head, ...rest] = path

	if (head === 'api') {
		return renderApiHelp(rest)
	}

	if (head === 'cli') {
		return (
			renderCliHelp(rest) || {
				error: `Unknown help path: cli/${rest.join('/')}`,
				available_paths: ['cli', 'cli/start']
			}
		)
	}

	return {
		error: `Unknown help path: ${head}`,
		available_paths: ['api', 'cli']
	}
}

const toApiToolInput = (input: {
	action: 'help' | 'list' | 'input_schema' | 'call'
	path?: Array<string>
	target?: string
	keyword?: string
	input?: Record<string, string | number | boolean>
}): ApiToolInput => ({
	...input,
	action: input.action === 'input_schema' ? 'schema' : input.action
})

const executeApiAction = async (input: {
	action: 'help' | 'list' | 'input_schema' | 'call'
	path?: Array<string>
	target?: string
	keyword?: string
	input?: Record<string, string | number | boolean>
}) => {
	const result = await executeApiTool(toApiToolInput(input))

	if (result && typeof result === 'object' && !Array.isArray(result)) {
		return {
			surface_used: 'api',
			...(result as Record<string, unknown>)
		}
	}

	return {
		surface_used: 'api',
		result
	}
}

export const createPolywiseTool = () =>
	tool({
		description: [
			'Inspect and call Polywise local capabilities from the global panel session.',
			'Prefer API-style actions because the Polywise CLI is mostly a thin wrapper over the same local backend map.',
			'Use action "help" first.',
			'For unfamiliar targets or after parameter-related failures, use action "input_schema" before action "call".'
		].join('\n'),
		inputSchema,
		execute: async input => {
			if (input.action === 'help') {
				return renderPolywiseHelp(input.path || [])
			}

			return executeApiAction(input)
		}
	})

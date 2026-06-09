import { tool } from 'ai'
import { tool as createCodexTool, createSdkMcpServer } from 'ai-sdk-provider-codex-app-server'
import { object, unknown as zodUnknown } from 'zod'

import type { ProviderOptions } from '@ai-sdk/provider-utils'
import type { ToolSet } from 'ai'
import type { Tool as CodexBridgeTool } from 'ai-sdk-provider-codex-app-server'
import type { ZodType } from 'zod'

interface BridgeSourceTool {
	description?: string
	inputSchema?: unknown
	execute?: (input: unknown, options?: { abortSignal?: AbortSignal }) => Promise<unknown> | unknown
}

const blocked_tool_names = new Set([
	'context_tool',
	'title_tool',
	'message_tool',
	'plan_tool',
	'question_tool',
	'skill_tool',
	'cron_tool',
	'error_collect_tool'
])

const codex_bridge_server_name = 'polywise-tools'
const codex_mirror_builtin_names = ['web_search', 'exec', 'patch'] as const
const passthrough_tool_names = new Set([
	'web_search_tool',
	'web_fetch_tool',
	'mcp_tool',
	'content_tool',
	'glob_tool',
	'search_file_tool',
	'read_file_tool',
	'write_file_tool',
	'edit_file_tool',
	'bash_tool',
	'agent_tool',
	'prompt_tool',
	'meta_tool'
])

const isZodSchema = (value: unknown): value is ZodType<unknown> => {
	return Boolean(value && typeof value === 'object' && 'safeParse' in value)
}

const buildBridgeTools = (tool_set?: ToolSet): Array<CodexBridgeTool> => {
	if (!tool_set) {
		return []
	}

	return Object.entries(tool_set).flatMap(([name, item]) => {
		if (blocked_tool_names.has(name)) {
			return []
		}

		if (!passthrough_tool_names.has(name)) {
			return []
		}

		const source_tool = item as BridgeSourceTool

		if (
			typeof source_tool.description !== 'string' ||
			!isZodSchema(source_tool.inputSchema) ||
			typeof source_tool.execute !== 'function'
		) {
			return []
		}

		return [
			createCodexTool({
				name,
				description: source_tool.description,
				parameters: source_tool.inputSchema,
				execute: async params => {
					const result = await source_tool.execute?.(params, {
						abortSignal: AbortSignal.timeout(60000)
					})

					return result
				}
			})
		]
	})
}

const buildMirrorToolSet = (tool_set?: ToolSet): ToolSet | undefined => {
	if (!tool_set) {
		return undefined
	}

	const mirror_tools = {} as ToolSet
	const fallback_schema = object({}).catchall(zodUnknown())

	for (const builtin_name of codex_mirror_builtin_names) {
		mirror_tools[builtin_name] = tool({
			description: `Codex built-in tool placeholder for ${builtin_name}.`,
			inputSchema: fallback_schema,
			execute: async () => ({ ok: true })
		})
	}

	for (const [name, item] of Object.entries(tool_set)) {
		if (blocked_tool_names.has(name) || !passthrough_tool_names.has(name)) {
			continue
		}

		const source_tool = item as BridgeSourceTool
		const schema = isZodSchema(source_tool.inputSchema) ? source_tool.inputSchema : fallback_schema

		mirror_tools[name] = tool({
			description: source_tool.description || `${name} placeholder`,
			inputSchema: schema,
			execute: async () => ({ ok: true })
		})

		mirror_tools[`mcp__${codex_bridge_server_name}__${name}`] = tool({
			description: source_tool.description || `${name} placeholder`,
			inputSchema: schema,
			execute: async () => ({ ok: true })
		})
	}

	return Object.keys(mirror_tools).length ? mirror_tools : undefined
}

export default (args: {
	tool_set?: ToolSet
	provider_options?: ProviderOptions
	server_name: string
}): { provider_options?: ProviderOptions; mirror_tools?: ToolSet } => {
	const { tool_set, provider_options, server_name } = args
	const tools = buildBridgeTools(tool_set)
	const mirror_tools = buildMirrorToolSet(tool_set)

	if (tools.length === 0) {
		return { provider_options, mirror_tools }
	}

	const base = (provider_options ?? {}) as Record<string, unknown>
	const codex_options = (base['codex-app-server'] as Record<string, unknown> | undefined) ?? {}

	return {
		provider_options: {
			...base,
			'codex-app-server': {
				...codex_options,
				mcpServers: {
					...(codex_options.mcpServers as Record<string, unknown> | undefined),
					[codex_bridge_server_name]: createSdkMcpServer({
						name: codex_bridge_server_name,
						tools
					})
				}
			}
		} as unknown as ProviderOptions,
		mirror_tools
	}
}

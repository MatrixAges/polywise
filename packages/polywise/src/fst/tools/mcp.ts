import { tool } from 'ai'
import { enum as Enum, number, object, string } from 'zod'

import { getMcpClient, hasMcpClient, listConfiguredMcps } from '../mcp'

import type { ListToolsResult, MCPClient } from '@ai-sdk/mcp'
import type Session from '../session'

type MCPTool = ListToolsResult['tools'][number]

const inputSchema = object({
	action: Enum(['list_servers', 'search_tools', 'read_tool', 'execute_tool']).describe(
		'list_servers: list configured MCP servers without starting them. search_tools: lazily inspect tools from one server or all enabled servers. read_tool: inspect a specific MCP tool schema. execute_tool: run a specific MCP tool.'
	),
	server_name: string()
		.optional()
		.describe(
			'[Optional for search_tools, required for read_tool/execute_tool] Exact configured MCP server name'
		),
	query: string()
		.optional()
		.describe('[Required for search_tools] Keyword used to match MCP tool names and descriptions'),
	tool_name: string()
		.optional()
		.describe('[Required for read_tool/execute_tool] Exact MCP tool name on the selected server'),
	arguments_json: string()
		.optional()
		.describe('[Optional for execute_tool] JSON string forwarded as tool arguments'),
	max_results: number().optional().describe('[Only for search_tools] Maximum results to return (default 8)')
})

const getConfiguredServers = (s: Session) => {
	const configured = listConfiguredMcps(s.disable_map)
	const server_map = new Map(configured.map(item => [item.name, item]))

	return { configured, server_map }
}

const getTargetServer = (s: Session, server_name?: string) => {
	const { configured, server_map } = getConfiguredServers(s)

	if (!server_name) {
		return {
			error: `server_name is required. Available MCP servers: ${configured.map(item => item.name).join(', ') || 'none'}`
		}
	}

	const target = server_map.get(server_name)

	if (!target) {
		return {
			error: `MCP server "${server_name}" is not enabled for this session. Available MCP servers: ${configured.map(item => item.name).join(', ') || 'none'}`
		}
	}

	return { target }
}

const parseArguments = (value?: string) => {
	if (!value?.trim()) {
		return {}
	}

	try {
		return JSON.parse(value) as Record<string, unknown>
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Invalid JSON'

		throw new Error(`arguments_json must be valid JSON: ${message}`)
	}
}

const getToolText = (tool_item: MCPTool) =>
	[tool_item.name, tool_item.title || '', tool_item.description || ''].join(' ').toLowerCase()

const listAllTools = async (client: MCPClient) => {
	const tools = [] as Array<MCPTool>
	let cursor = undefined as string | undefined

	while (true) {
		const result: ListToolsResult = await client.listTools({
			params: cursor ? { cursor } : undefined
		})

		tools.push(...result.tools)

		if (!result.nextCursor) {
			return tools
		}

		cursor = result.nextCursor
	}
}

const executeSelectedTool = async (client: MCPClient, tool_item: MCPTool, args: Record<string, unknown>) => {
	const tools = client.toolsFromDefinitions({
		tools: [tool_item]
	} as ListToolsResult)
	const target_tool = tools[tool_item.name]

	if (!target_tool?.execute) {
		throw new Error(`MCP tool "${tool_item.name}" is not executable`)
	}

	return target_tool.execute(args, { toolCallId: '', messages: [] })
}

export const createMcpTool = (s: Session) => {
	return tool({
		description: [
			'Discover and execute configured MCP servers lazily.',
			'Use action "list_servers" first to see configured MCP servers without starting them.',
			'Use action "search_tools" to inspect available MCP tools. Prefer providing server_name, especially when the user mentions [MCP: server-name].',
			'Use action "read_tool" before execution when the input schema or purpose is unclear.',
			'Use action "execute_tool" to run the selected MCP tool with arguments_json.'
		].join('\n'),
		inputSchema,
		execute: async input => {
			if (input.action === 'list_servers') {
				const { configured } = getConfiguredServers(s)

				return {
					action: 'list_servers',
					count: configured.length,
					servers: configured.map(item => ({
						name: item.name,
						type: item.type,
						description: item.description,
						connected: hasMcpClient(item.name)
					}))
				}
			}

			if (input.action === 'search_tools') {
				if (!input.query?.trim()) {
					return { action: 'search_tools', error: 'query is required for search_tools action' }
				}

				const { configured } = getConfiguredServers(s)
				const target_servers = input.server_name
					? configured.filter(item => item.name === input.server_name)
					: configured

				if (!target_servers.length) {
					return {
						action: 'search_tools',
						error: input.server_name
							? `MCP server "${input.server_name}" is not enabled for this session`
							: 'No enabled MCP servers are configured for this session'
					}
				}

				const query = input.query.trim().toLowerCase()
				const max_results = input.max_results ?? 8
				const matches = [] as Array<{
					server_name: string
					tool_name: string
					title?: string
					description?: string
					score: number
				}>

				for (const server of target_servers) {
					const client = await getMcpClient(server.name, server)
					const tools = await listAllTools(client)

					for (const tool_item of tools) {
						const haystack = getToolText(tool_item)

						if (!haystack.includes(query)) {
							continue
						}

						const direct_name_match = tool_item.name.toLowerCase() === query
						const score =
							(direct_name_match ? 1000 : 0) +
							(tool_item.name.toLowerCase().includes(query) ? 100 : 0) +
							(tool_item.description?.toLowerCase().includes(query) ? 10 : 0)

						matches.push({
							server_name: server.name,
							tool_name: tool_item.name,
							title: tool_item.title,
							description: tool_item.description,
							score
						})
					}
				}

				return {
					action: 'search_tools',
					count: matches.length,
					results: matches.sort((a, b) => b.score - a.score).slice(0, max_results)
				}
			}

			if (input.action === 'read_tool') {
				if (!input.tool_name) {
					return { action: 'read_tool', error: 'tool_name is required for read_tool action' }
				}

				const target_server = getTargetServer(s, input.server_name)

				if ('error' in target_server) {
					return { action: 'read_tool', error: target_server.error }
				}

				const client = await getMcpClient(target_server.target.name, target_server.target)
				const tools = await listAllTools(client)
				const tool_item = tools.find(item => item.name === input.tool_name)

				if (!tool_item) {
					return {
						action: 'read_tool',
						server_name: target_server.target.name,
						tool_name: input.tool_name,
						error: `MCP tool "${input.tool_name}" was not found on server "${target_server.target.name}"`
					}
				}

				return {
					action: 'read_tool',
					server_name: target_server.target.name,
					tool_name: tool_item.name,
					title: tool_item.title,
					description: tool_item.description,
					input_schema: tool_item.inputSchema,
					output_schema: tool_item.outputSchema ?? null
				}
			}

			if (!input.tool_name) {
				return { action: 'execute_tool', error: 'tool_name is required for execute_tool action' }
			}

			const target_server = getTargetServer(s, input.server_name)

			if ('error' in target_server) {
				return { action: 'execute_tool', error: target_server.error }
			}

			try {
				const args = parseArguments(input.arguments_json)
				const client = await getMcpClient(target_server.target.name, target_server.target)
				const tools = await listAllTools(client)
				const tool_item = tools.find(item => item.name === input.tool_name)

				if (!tool_item) {
					return {
						action: 'execute_tool',
						server_name: target_server.target.name,
						tool_name: input.tool_name,
						error: `MCP tool "${input.tool_name}" was not found on server "${target_server.target.name}"`
					}
				}

				const result = await executeSelectedTool(client, tool_item, args)

				return {
					action: 'execute_tool',
					server_name: target_server.target.name,
					tool_name: tool_item.name,
					result
				}
			} catch (error) {
				return {
					action: 'execute_tool',
					server_name: target_server.target.name,
					tool_name: input.tool_name,
					error: error instanceof Error ? error.message : String(error)
				}
			}
		}
	})
}

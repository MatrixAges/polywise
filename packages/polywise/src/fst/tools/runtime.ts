import { createSystemTool } from '@core/fst/agents'
import { loadMcpTools } from '@core/fst/mcp'
import { getSystemTools } from '@core/utils'

import { createBashTool } from './bash'
import { createContentTool } from './content'
import { createEditFileTool } from './edit'
import { createGlobTool } from './glob'
import { createMetaTool, getCustomToolsPrompt } from './meta'
import { createSearchFileTool } from './search'
import { getSkillPrompt } from './skill'
import { createWebFetchTool } from './webfetch'
import { createWebSearchTool } from './websearch'

import type { ToolSet } from 'ai'
import type Session from '../session'

type SharedRuntimeToolKey =
	| 'bash_tool'
	| 'read_file_tool'
	| 'write_file_tool'
	| 'edit_file_tool'
	| 'meta_tool'
	| 'glob_tool'
	| 'search_file_tool'
	| 'content_tool'
	| 'web_search_tool'
	| 'web_fetch_tool'
	| 'system_tool'

interface BuildSharedRuntimeToolsArgs {
	s: Session
	model_tools?: ToolSet
	extra_tools?: ToolSet
	transform_tool?: <T>(key: SharedRuntimeToolKey, tool_item: T) => T
}

const applyTransform = <T>(
	transform_tool: BuildSharedRuntimeToolsArgs['transform_tool'],
	key: SharedRuntimeToolKey,
	tool_item: T
) => (transform_tool ? transform_tool(key, tool_item) : tool_item)

export const buildSharedRuntimeTools = async (args: BuildSharedRuntimeToolsArgs) => {
	const { s, model_tools = {}, extra_tools = {}, transform_tool } = args
	const bash_tool = await createBashTool(s)
	const mcp_tools = await loadMcpTools(s)
	const system_tools_prompt = await getSystemTools()
	const custom_tools_prompt = getCustomToolsPrompt(s.custom_tools_map)
	const skill_prompt = getSkillPrompt(s.skill_map)

	const tools = {
		...model_tools,
		...mcp_tools,
		...extra_tools,
		meta_tool: applyTransform(transform_tool, 'meta_tool', createMetaTool(s)),
		glob_tool: applyTransform(transform_tool, 'glob_tool', createGlobTool(s)),
		search_file_tool: applyTransform(
			transform_tool,
			'search_file_tool',
			createSearchFileTool(s, bash_tool.env)
		),
		content_tool: applyTransform(transform_tool, 'content_tool', createContentTool(s)),
		web_search_tool: applyTransform(transform_tool, 'web_search_tool', createWebSearchTool()),
		web_fetch_tool: applyTransform(transform_tool, 'web_fetch_tool', createWebFetchTool()),
		system_tool: applyTransform(transform_tool, 'system_tool', createSystemTool(s)),
		read_file_tool: applyTransform(transform_tool, 'read_file_tool', bash_tool.readFile),
		bash_tool: applyTransform(transform_tool, 'bash_tool', bash_tool.bash),
		write_file_tool: applyTransform(transform_tool, 'write_file_tool', bash_tool.writeFile),
		edit_file_tool: applyTransform(transform_tool, 'edit_file_tool', createEditFileTool(s))
	} as ToolSet

	return {
		tools,
		system_tools_prompt,
		custom_tools_prompt,
		skill_prompt
	}
}

import { createSystemTool } from '@core/fst/agents'
import { loadMcpTools } from '@core/fst/mcp'
import { getSystemTools } from '@core/utils'

import { createAgentTool } from './agent'
import { createBashTool } from './bash'
import { createContentTool } from './content'
import { createEditFileTool } from './edit'
import { createGlobTool } from './glob'
import { createMetaTool, getCustomToolsPrompt } from './meta'
import { createNativeAccessTools } from './native'
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
	| 'agent_tool'

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
	const is_full_access = s.audit_mode === 'full'
	const disable_map = new Set(s.disable_map)
	const has_system_tool = s.audit_mode === 'auto' && s.enable_sub_agent && !disable_map.has('system_tool')
	const has_agent_tool = s.enable_agent_tool && !disable_map.has('agent_tool')
	const bash_tool = is_full_access ? await createNativeAccessTools(s) : await createBashTool(s)
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
		search_file_tool: applyTransform(transform_tool, 'search_file_tool', createSearchFileTool(s)),
		content_tool: applyTransform(transform_tool, 'content_tool', createContentTool(s)),
		web_search_tool: applyTransform(transform_tool, 'web_search_tool', createWebSearchTool()),
		web_fetch_tool: applyTransform(transform_tool, 'web_fetch_tool', createWebFetchTool()),
		read_file_tool: applyTransform(transform_tool, 'read_file_tool', bash_tool.readFile),
		bash_tool: applyTransform(transform_tool, 'bash_tool', bash_tool.bash),
		write_file_tool: applyTransform(transform_tool, 'write_file_tool', bash_tool.writeFile),
		edit_file_tool: applyTransform(transform_tool, 'edit_file_tool', createEditFileTool(s))
	} as ToolSet

	if (has_agent_tool) {
		tools.agent_tool = applyTransform(transform_tool, 'agent_tool', createAgentTool(s))
	}

	if (has_system_tool) {
		tools.system_tool = applyTransform(transform_tool, 'system_tool', createSystemTool(s))
	}

	for (const key of disable_map) {
		delete tools[key]
	}

	return {
		tools,
		system_tools_prompt,
		custom_tools_prompt,
		skill_prompt,
		has_system_tool
	}
}

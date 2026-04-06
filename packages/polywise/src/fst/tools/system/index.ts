import system_agent_prompt from '@core/consts/prompts/system_agent_prompt.md'
import { readUIMessageStream, stepCountIs, tool, ToolLoopAgent } from 'ai'
import { getId } from 'stk/utils'
import { object, string } from 'zod'

import { createSystemBashTool } from './bash'

import type Index from '../../session'

export const createSystemTool = (s: Index) => {
	return tool({
		description:
			'Access files and directories outside the project working directory, such as user home directory or system directories. For paths that bash_tool cannot reach, use this tool instead.',
		inputSchema: object({
			request: string().describe('Natural language request for file system operation')
		}),
		execute: async function* ({ request }, { abortSignal }) {
			const bash_tool = await createSystemBashTool(s)

			const agent = new ToolLoopAgent({
				model: s.model.model,
				instructions: system_agent_prompt,
				tools: {
					bash_tool: bash_tool.bash,
					read_file_tool: bash_tool.readFile,
					write_file_tool: bash_tool.writeFile
				},
				stopWhen: stepCountIs(60)
			})

			const result = await agent.stream({
				prompt: request,
				abortSignal
			})

			for await (const message of readUIMessageStream({
				stream: result.toUIMessageStream({ generateMessageId: getId })
			})) {
				yield message
			}
		}
	})
}

export default createSystemTool

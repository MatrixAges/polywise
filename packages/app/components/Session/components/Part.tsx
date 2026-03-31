import { isStaticToolUIPart } from 'ai'

import { MessageResponse } from '@/__shadcn__/components/ai-elements'
import { Reasoning, ReasoningContent, ReasoningTrigger } from '@/__shadcn__/components/ai-elements/reasoning'
import { Tool, ToolContent, ToolHeader, ToolInput, ToolOutput } from '@/__shadcn__/components/ai-elements/tool'

import type { DynamicToolUIPart, ToolUIPart } from 'ai'
import type { IPropsPart } from '../types'

const Index = (props: IPropsPart) => {
	const { streaming, metadata, part } = props
	const { type } = part

	switch (type) {
		case 'reasoning':
			return (
				<Reasoning
					className='w-full'
					isStreaming={streaming}
					duration={Math.ceil((metadata?.reasoning_duration ?? 0) / 1000)}
				>
					<ReasoningTrigger />
					<ReasoningContent>{part.text}</ReasoningContent>
				</Reasoning>
			)
		case 'text':
			return <MessageResponse isAnimating>{part.text}</MessageResponse>
		case 'dynamic-tool': {
			const tool_part = part as DynamicToolUIPart

			return (
				<Tool>
					<ToolHeader
						type={tool_part.type}
						state={tool_part.state}
						toolName={tool_part.toolName}
						title={tool_part.title}
					/>
					<ToolContent>
						{tool_part.input !== undefined && <ToolInput input={tool_part.input} />}
						{(tool_part.output ?? tool_part.errorText) && (
							<ToolOutput output={tool_part.output} errorText={tool_part.errorText} />
						)}
					</ToolContent>
				</Tool>
			)
		}
	}

	if (isStaticToolUIPart(part)) {
		const tool_part = part as ToolUIPart

		if (tool_part.type === 'tool-context_tool') return null

		return (
			<Tool>
				<ToolHeader type={tool_part.type} state={tool_part.state} title={tool_part.title} />
				<ToolContent>
					{tool_part.input !== undefined && <ToolInput input={tool_part.input} />}
					{(tool_part.output ?? tool_part.errorText) && (
						<ToolOutput output={tool_part.output} errorText={tool_part.errorText} />
					)}
				</ToolContent>
			</Tool>
		)
	}

	return null
}

export default $app.memo(Index)

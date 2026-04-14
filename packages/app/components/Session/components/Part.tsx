import { isStaticToolUIPart } from 'ai'

import { MessageResponse } from '@/__shadcn__/components/ai-elements'
import { Reasoning, ReasoningContent, ReasoningTrigger } from '@/__shadcn__/components/ai-elements/reasoning'
import { Tool, ToolContent, ToolHeader, ToolInput, ToolOutput } from '@/__shadcn__/components/ai-elements/tool'
import { getToolDesc } from '@/utils'

import Edit from './Edit'
import Question from './Question'
import SubAgent from './SubAgent'

import type { EditResult, QuestionInput } from '@core/fst/tools'
import type { DynamicToolUIPart, ToolUIPart } from 'ai'
import type { IPropsPart } from '../types'

const Index = (props: IPropsPart) => {
	const { streaming, metadata, part, answer } = props
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
			return <MessageResponse isAnimating={streaming}>{part.text}</MessageResponse>
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
						{(tool_part.input !== undefined || 'rawInput' in tool_part) && (
							<ToolInput input={tool_part.input ?? (tool_part as any).rawInput} />
						)}
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

		if (tool_part.type === 'tool-question_tool' && tool_part.input) {
			return (
				<Question
					streaming={streaming}
					input={tool_part.input as QuestionInput}
					output={tool_part.output as string}
					answer={answer}
				/>
			)
		}

		if (tool_part.type === 'tool-system_tool' && tool_part.input && tool_part.output) {
			return <SubAgent streaming={streaming} part={tool_part} answer={answer}></SubAgent>
		}

		if (tool_part.type === 'tool-edit_file_tool' && tool_part.output) {
			return <Edit streaming={streaming} output={tool_part.output as EditResult} />
		}

		return (
			<Tool>
				<ToolHeader
					type={tool_part.type}
					state={tool_part.state}
					title={tool_part.title}
					desc={getToolDesc(tool_part)}
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

	return null
}

export default $app.memo(Index)

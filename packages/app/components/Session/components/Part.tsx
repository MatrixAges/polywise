import { isStaticToolUIPart } from 'ai'

import { MessageResponse } from '@/__shadcn__/components/ai-elements'
import { Reasoning, ReasoningContent, ReasoningTrigger } from '@/__shadcn__/components/ai-elements/reasoning'
import { Tool, ToolContent, ToolHeader, ToolInput, ToolOutput } from '@/__shadcn__/components/ai-elements/tool'

import QuestionPanel from './QuestionPanel'

import type { DynamicToolUIPart, ToolUIPart } from 'ai'
import type { IPropsPart } from '../types'

const Index = (props: IPropsPart) => {
	const { streaming, metadata, part, submitQuestionAnswer } = props
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

			console.log('dynamic-tool part:', JSON.stringify(part, null, 2))

			if (tool_part.toolName === 'question_tool') {
				const input = tool_part.input as unknown as {
					question: string
					header: string
					options: Array<{ label: string; description: string }>
					multiple?: boolean
					custom?: boolean
				}

				switch (tool_part.state) {
					case 'input-available':
						return (
							<QuestionPanel
								question={input.question}
								header={input.header}
								options={input.options}
								multiple={input.multiple}
								custom={input.custom}
								onSelect={answer => submitQuestionAnswer(answer)}
							/>
						)
					case 'output-available':
						return (
							<Tool>
								<ToolHeader
									type={tool_part.type}
									state={tool_part.state}
									toolName={tool_part.toolName}
									title={tool_part.title}
								/>
								<ToolContent>
									<ToolOutput output={tool_part.output} errorText={undefined} />
								</ToolContent>
							</Tool>
						)
					case 'output-error':
						return (
							<Tool>
								<ToolHeader
									type={tool_part.type}
									state={tool_part.state}
									toolName={tool_part.toolName}
									title={tool_part.title}
								/>
								<ToolContent>
									<ToolOutput output={undefined} errorText={tool_part.errorText} />
								</ToolContent>
							</Tool>
						)
					default:
						return (
							<Tool>
								<ToolHeader
									type={tool_part.type}
									state={tool_part.state}
									toolName={tool_part.toolName}
									title={tool_part.title}
								/>
								<ToolContent>
									{tool_part.input !== undefined && (
										<ToolInput input={tool_part.input} />
									)}
								</ToolContent>
							</Tool>
						)
				}
			}

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

		if (tool_part.type === 'tool-question_tool') {
			const input = tool_part.input as unknown as {
				question: string
				header: string
				options: Array<{ label: string; description: string }>
				multiple?: boolean
				custom?: boolean
			}

			switch (tool_part.state) {
				case 'input-available':
					return (
						<QuestionPanel
							question={input.question}
							header={input.header}
							options={input.options}
							multiple={input.multiple}
							custom={input.custom}
							onSelect={answer => submitQuestionAnswer(answer)}
						/>
					)
				case 'output-available':
					return (
						<Tool>
							<ToolHeader
								type={tool_part.type}
								state={tool_part.state}
								toolName={tool_part.title}
								title={tool_part.title}
							/>
							<ToolContent>
								<ToolOutput output={tool_part.output} errorText={undefined} />
							</ToolContent>
						</Tool>
					)
				case 'output-error':
					return (
						<Tool>
							<ToolHeader
								type={tool_part.type}
								state={tool_part.state}
								toolName={tool_part.title}
								title={tool_part.title}
							/>
							<ToolContent>
								<ToolOutput output={undefined} errorText={tool_part.errorText} />
							</ToolContent>
						</Tool>
					)
				default:
					return (
						<Tool>
							<ToolHeader
								type={tool_part.type}
								state={tool_part.state}
								title={tool_part.title}
							/>
							<ToolContent>
								{tool_part.input !== undefined && <ToolInput input={tool_part.input} />}
							</ToolContent>
						</Tool>
					)
			}
		}

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

import type { CodeExecutionResult, ExecutableCodePart, FunctionCall, FunctionResponse, Part, TextPart } from './types'

export type InputPart = TextPart | FunctionCall | FunctionResponse | ExecutableCodePart | CodeExecutionResult

export type Message = {
	role: 'user' | 'model'
	parts: InputPart[]
}

export type ProcessedInput = {
	messages: Message[]
	systemInstruction?: string
}

export class Input {
	private messages: Message[] = []
	private systemInstruction?: string

	/**
	 * Set system instruction
	 */
	setSystemInstruction(instruction: string): this {
		this.systemInstruction = instruction
		return this
	}

	/**
	 * Add user message
	 */
	addUserMessage(parts: InputPart | InputPart[]): this {
		this.messages.push({
			role: 'user',
			parts: Array.isArray(parts) ? parts : [parts]
		})
		return this
	}

	/**
	 * Add model message
	 */
	addModelMessage(parts: InputPart | InputPart[]): this {
		this.messages.push({
			role: 'model',
			parts: Array.isArray(parts) ? parts : [parts]
		})
		return this
	}

	/**
	 * Add text message (user by default)
	 */
	addText(text: string, role: 'user' | 'model' = 'user'): this {
		const textPart: TextPart = { text }
		if (role === 'user') {
			this.addUserMessage(textPart)
		} else {
			this.addModelMessage(textPart)
		}
		return this
	}

	/**
	 * Add function call
	 */
	addFunctionCall(name: string, args: Record<string, unknown>): this {
		const functionCall: FunctionCall = {
			functionCall: { name, args }
		}
		this.addModelMessage(functionCall)
		return this
	}

	/**
	 * Add function response
	 */
	addFunctionResponse(name: string, response: Record<string, unknown>): this {
		const functionResponse: FunctionResponse = {
			functionResponse: { name, response }
		}
		this.addUserMessage(functionResponse)
		return this
	}

	/**
	 * Add executable code
	 */
	addExecutableCode(language: string, code: string): this {
		const executableCode: ExecutableCodePart = {
			executableCode: { language, code }
		}
		this.addModelMessage(executableCode)
		return this
	}

	/**
	 * Add code execution result
	 */
	addCodeExecutionResult(
		outcome: 'OUTCOME_OK' | 'OUTCOME_FAILED' | 'OUTCOME_DEADLINE_EXCEEDED',
		output: string
	): this {
		const codeExecutionResult: CodeExecutionResult = {
			codeExecutionResult: { outcome, output }
		}
		this.addUserMessage(codeExecutionResult)
		return this
	}

	/**
	 * Get processed input data
	 */
	build(): ProcessedInput {
		return {
			messages: this.messages,
			systemInstruction: this.systemInstruction
		}
	}

	/**
	 * Clear all messages and system instruction
	 */
	clear(): this {
		this.messages = []
		this.systemInstruction = undefined
		return this
	}

	/**
	 * Get current messages
	 */
	getMessages(): Message[] {
		return this.messages
	}

	/**
	 * Get system instruction
	 */
	getSystemInstruction(): string | undefined {
		return this.systemInstruction
	}
}

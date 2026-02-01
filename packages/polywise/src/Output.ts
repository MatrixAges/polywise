import type { ExecutableCodePart, FunctionCall, Part, TextPart } from './types'

export type ParsedOutput = {
	text: string
	parts: Part[]
	functionCalls: Array<{ name: string; args: Record<string, unknown> }>
	executableCode: Array<{ language: string; code: string }>
}

export class Output {
	/**
	 * Parse AI response parts
	 */
	static parse(parts: Part[]): ParsedOutput {
		const result: ParsedOutput = {
			text: '',
			parts,
			functionCalls: [],
			executableCode: []
		}

		for (const part of parts) {
			if ('text' in part) {
				result.text += part.text
			} else if ('functionCall' in part) {
				result.functionCalls.push({
					name: part.functionCall.name,
					args: part.functionCall.args
				})
			} else if ('executableCode' in part) {
				result.executableCode.push({
					language: part.executableCode.language,
					code: part.executableCode.code
				})
			}
		}

		return result
	}

	/**
	 * Extract text content from parts
	 */
	static extractText(parts: Part[]): string {
		return parts
			.filter((part): part is TextPart => 'text' in part)
			.map(part => part.text)
			.join('')
	}

	/**
	 * Extract function calls from parts
	 */
	static extractFunctionCalls(parts: Part[]): Array<{ name: string; args: Record<string, unknown> }> {
		return parts
			.filter((part): part is FunctionCall => 'functionCall' in part)
			.map(part => ({
				name: part.functionCall.name,
				args: part.functionCall.args
			}))
	}

	/**
	 * Extract executable code from parts
	 */
	static extractExecutableCode(parts: Part[]): Array<{ language: string; code: string }> {
		return parts
			.filter((part): part is ExecutableCodePart => 'executableCode' in part)
			.map(part => ({
				language: part.executableCode.language,
				code: part.executableCode.code
			}))
	}

	/**
	 * Check if parts contain function calls
	 */
	static hasFunctionCalls(parts: Part[]): boolean {
		return parts.some(part => 'functionCall' in part)
	}

	/**
	 * Check if parts contain executable code
	 */
	static hasExecutableCode(parts: Part[]): boolean {
		return parts.some(part => 'executableCode' in part)
	}

	/**
	 * Check if parts contain only text
	 */
	static isTextOnly(parts: Part[]): boolean {
		return parts.every(part => 'text' in part)
	}
}

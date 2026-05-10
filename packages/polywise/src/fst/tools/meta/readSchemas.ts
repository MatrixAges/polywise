import { readFile } from 'atomically'
import { z } from 'zod'

export type JsonSchema = Parameters<typeof z.fromJSONSchema>[0]

const static_import_pattern = /^\s*import\s+[\s\S]*?\s+from\s+(['"])([^'"]+)\1\s*;?/gm
const side_effect_import_pattern = /^\s*import\s+(['"])([^'"]+)\1\s*;?/gm
const export_from_pattern = /^\s*export\s+(?:\*|\{[\s\S]*?\})\s+from\s+(['"])([^'"]+)\1\s*;?/gm
const dynamic_import_pattern = /\bimport\s*\(/

const getErrorMessage = (err: unknown) => {
	return err instanceof Error ? err.message : 'Invalid JSON Schema'
}

const validateJsonSchema = (value: unknown, schema_name: 'input_schema' | 'output_schema') => {
	if (!value || typeof value !== 'object' || Array.isArray(value)) {
		throw new Error(`${schema_name} must be a JSON object`)
	}

	try {
		z.fromJSONSchema(value as JsonSchema)

		return value as JsonSchema
	} catch (err) {
		throw new Error(`${schema_name} must be valid JSON Schema: ${getErrorMessage(err)}`)
	}
}

const collectImportSources = (content: string, pattern: RegExp) => {
	const sources = [] as string[]

	for (const match of content.matchAll(pattern)) {
		const source = match[2]

		if (source) {
			sources.push(source)
		}
	}

	return sources
}

export const validateCustomToolImports = (content: string) => {
	if (dynamic_import_pattern.test(content)) {
		throw new Error('Custom tools only support static imports from node:* modules')
	}

	const sources = [
		...collectImportSources(content, static_import_pattern),
		...collectImportSources(content, side_effect_import_pattern),
		...collectImportSources(content, export_from_pattern)
	]

	for (const source of sources) {
		if (!source.startsWith('node:')) {
			throw new Error(`Custom tools only allow imports from node:* modules. Found "${source}"`)
		}
	}
}

export const parseJsonSchema = (value: string | undefined, schema_name: 'input_schema' | 'output_schema') => {
	if (!value?.trim()) {
		return undefined
	}

	try {
		return validateJsonSchema(JSON.parse(value) as unknown, schema_name)
	} catch (err) {
		if (err instanceof Error && err.message.startsWith(`${schema_name} must`)) {
			throw err
		}

		throw new Error(`${schema_name} must be valid JSON Schema: ${getErrorMessage(err)}`)
	}
}

export const validateSchemaValue = <T>(schema: JsonSchema | undefined, value: unknown, schema_name: string) => {
	if (!schema) {
		return value as T
	}

	try {
		return z.fromJSONSchema(schema).parse(value) as T
	} catch (err) {
		throw new Error(`${schema_name} validation failed: ${getErrorMessage(err)}`)
	}
}

export const loadCustomToolModule = async (tool_path: string) => {
	const content = await readFile(tool_path, 'utf8')

	validateCustomToolImports(content)

	const target_module = await import(`file://${tool_path}`)
	const input_schema =
		target_module.input_schema === undefined
			? undefined
			: validateJsonSchema(target_module.input_schema as unknown, 'input_schema')
	const output_schema =
		target_module.output_schema === undefined
			? undefined
			: validateJsonSchema(target_module.output_schema as unknown, 'output_schema')

	return {
		module: target_module,
		input_schema,
		output_schema
	}
}

const readSchemas = async (tool_path: string) => {
	const { input_schema, output_schema } = await loadCustomToolModule(tool_path)

	return {
		input_schema,
		output_schema
	}
}

export default readSchemas

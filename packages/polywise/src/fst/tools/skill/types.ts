import { literal, number, object, string, union } from 'zod'

export const search_schema = object({
	action: literal('search').describe('Action: search to find skills by keyword'),
	keyword: string().describe('Keywords to search for in skill names and descriptions'),
	max_results: number().optional().describe('Maximum results to return (default 5)')
})

export const read_schema = object({
	action: literal('read').describe('Action: read to get full skill content'),
	skill_name: string().describe('The exact skill name to read')
})

export const inputSchema = union([search_schema, read_schema])

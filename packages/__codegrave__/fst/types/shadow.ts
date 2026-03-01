import { z } from 'zod'

export const ReferenceSchema = z.object({
	name: z.string().describe('Name of the reference'),
	desc: z.string().describe('Description of the reference'),
	path: z.string().describe('File path of the reference')
})

export const TaskSchema = z.object({
	name: z.string().describe('Name of the task'),
	desc: z.string().describe('Description of the task'),
	status: z.enum(['pending', 'in_progress', 'completed', 'failed']).describe('Status of the task')
})

export const ShadowContextSchema = z.object({
	refs: z.array(ReferenceSchema).describe('Associated files and references. Use these paths to read details.'),
	context: z
		.string()
		.describe(
			'Summary of the current conversation context. Must be accurate and detailed enough for you to know what happened.'
		),
	tasks: z.array(TaskSchema).describe('List of tasks'),
	current_task: z.string().describe('The task currently being executed')
})

export type ShadowContext = z.infer<typeof ShadowContextSchema>
export type Reference = z.infer<typeof ReferenceSchema>
export type Task = z.infer<typeof TaskSchema>

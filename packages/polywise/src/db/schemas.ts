import { todo_priority_schema, todo_status_schema } from '@core/consts/db'
import { createInsertSchema } from 'drizzle-zod'
import { z } from 'zod'

import { agent, todo } from './schema'

const agent_model_schema = z.object({
	provider: z.string(),
	model: z.string(),
	effort: z.string().optional(),
	options: z.unknown().optional()
})
const agent_role_schema = z.string().trim().min(1).max(20)

const todo_timestamp_schema = z.number().int()

export const todo_insert_schema = createInsertSchema(todo, {
	priority: todo_priority_schema.optional(),
	status: todo_status_schema.optional(),
	due_at: todo_timestamp_schema.optional(),
	created_at: todo_timestamp_schema.optional(),
	updated_at: todo_timestamp_schema.optional()
})

export const todo_create_input_schema = todo_insert_schema
	.omit({
		id: true,
		order: true,
		created_at: true,
		updated_at: true
	})
	.extend({
		project_id: z.string().optional()
	})

export const todo_update_input_schema = todo_insert_schema
	.omit({
		created_at: true,
		updated_at: true
	})
	.partial()
	.extend({
		id: z.string()
	})

export const agent_insert_schema = createInsertSchema(agent, {
	role: agent_role_schema,
	photo: z.unknown().optional(),
	avatar: z.unknown().optional(),
	tools: z.array(z.string()).optional(),
	model: agent_model_schema,
	created_at: todo_timestamp_schema.optional(),
	updated_at: todo_timestamp_schema.optional()
})

export const agent_create_input_schema = agent_insert_schema
	.omit({
		id: true,
		order: true,
		created_at: true,
		updated_at: true
	})
	.extend({
		name: z.string().optional(),
		role: agent_role_schema.optional(),
		description: z.string().optional(),
		model: agent_model_schema.optional(),
		purpose: z.string().optional()
	})

export const agent_update_input_schema = agent_insert_schema
	.omit({
		created_at: true,
		updated_at: true
	})
	.partial()
	.extend({
		id: z.string()
	})

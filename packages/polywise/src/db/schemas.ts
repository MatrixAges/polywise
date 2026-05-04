import { todo_priority_schema, todo_status_schema } from '@core/consts/db'
import { createInsertSchema } from 'drizzle-zod'
import { infer as Infer, z } from 'zod'

import { todo } from './schema'

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

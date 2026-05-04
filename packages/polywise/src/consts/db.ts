import { sql } from 'drizzle-orm'
import { z } from 'zod'

import type { SQLWrapper } from 'drizzle-orm'

export const todo_priority_schema = z.enum(['urgent', 'high', 'medium', 'low', 'none'])
export const todo_status_schema = z.enum([
	'draft',
	'pending',
	'processing',
	'unreview',
	'done',
	'canceled',
	'error',
	'archive'
])

export const todo_status_list = todo_status_schema.options
export const todo_visible_status_list = todo_status_list.filter(status => status !== 'archive')

export const getTodoStatusOrder = (status: SQLWrapper) => {
	return sql`CASE ${status} WHEN 'draft' THEN 0 WHEN 'pending' THEN 1 WHEN 'processing' THEN 2 WHEN 'unreview' THEN 3 WHEN 'done' THEN 4 WHEN 'canceled' THEN 5 WHEN 'error' THEN 6 WHEN 'archive' THEN 7 END`
}

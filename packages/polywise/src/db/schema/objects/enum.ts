import { pgEnum } from 'drizzle-orm/pg-core'

export const Status = pgEnum('task_status', ['pending', 'processing', 'completed', 'failed'])

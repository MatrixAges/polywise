import { message, session } from './schema'

import type { InferInsertModel, InferSelectModel } from 'drizzle-orm'

export type Session = InferSelectModel<typeof session>
export type SessionInsert = InferInsertModel<typeof session>
export type Message = InferSelectModel<typeof message>
export type MessageInsert = InferInsertModel<typeof message>

import { agent, message, project, session, todo } from './schema'

import type { InferInsertModel, InferSelectModel } from 'drizzle-orm'

export type Session = InferSelectModel<typeof session>
export type SessionInsert = InferInsertModel<typeof session>
export type Agent = InferSelectModel<typeof agent>
export type AgentInsert = InferInsertModel<typeof agent>
export type Message = InferSelectModel<typeof message>
export type MessageInsert = InferInsertModel<typeof message>
export type Project = InferSelectModel<typeof project>
export type ProjectInsert = InferInsertModel<typeof project>
export type Todo = InferSelectModel<typeof todo>
export type TodoInsert = InferInsertModel<typeof todo>

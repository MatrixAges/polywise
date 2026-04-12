import { agent, article, chunk, edge, message, node, notification, project, session, task, todo } from './schema'

import type { InferInsertModel, InferSelectModel } from 'drizzle-orm'

export type Session = InferSelectModel<typeof session>
export type SessionInsert = InferInsertModel<typeof session>
export type Agent = InferSelectModel<typeof agent>
export type AgentInsert = InferInsertModel<typeof agent>
export type Article = InferSelectModel<typeof article>
export type ArticleInsert = InferInsertModel<typeof article>
export type Chunk = InferSelectModel<typeof chunk>
export type ChunkInsert = InferInsertModel<typeof chunk>
export type Edge = InferSelectModel<typeof edge>
export type EdgeInsert = InferInsertModel<typeof edge>
export type Message = InferSelectModel<typeof message>
export type MessageInsert = InferInsertModel<typeof message>
export type Node = InferSelectModel<typeof node>
export type NodeInsert = InferInsertModel<typeof node>
export type Notification = InferSelectModel<typeof notification>
export type NotificationInsert = InferInsertModel<typeof notification>
export type Project = InferSelectModel<typeof project>
export type ProjectInsert = InferInsertModel<typeof project>
export type Task = InferSelectModel<typeof task>
export type TaskInsert = InferInsertModel<typeof task>
export type Todo = InferSelectModel<typeof todo>
export type TodoInsert = InferInsertModel<typeof todo>

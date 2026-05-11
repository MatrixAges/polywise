import {
	agent,
	article,
	chunk,
	document,
	edge,
	file,
	link,
	message,
	node,
	notification,
	project,
	session,
	skill,
	todo
} from './schema'

import type { InferInsertModel, InferSelectModel } from 'drizzle-orm'

export type Session = InferSelectModel<typeof session>
export type SessionInsert = InferInsertModel<typeof session>
export type Agent = InferSelectModel<typeof agent>
export type AgentInsert = InferInsertModel<typeof agent>
export type Skill = InferSelectModel<typeof skill>
export type SkillInsert = InferInsertModel<typeof skill>
export type Article = InferSelectModel<typeof article>
export type ArticleInsert = InferInsertModel<typeof article>
export type Document = InferSelectModel<typeof document>
export type DocumentInsert = InferInsertModel<typeof document>
export type Chunk = InferSelectModel<typeof chunk>
export type ChunkInsert = InferInsertModel<typeof chunk>
export type Edge = InferSelectModel<typeof edge>
export type EdgeInsert = InferInsertModel<typeof edge>
export type File = InferSelectModel<typeof file>
export type FileInsert = InferInsertModel<typeof file>
export type Message = InferSelectModel<typeof message>
export type MessageInsert = InferInsertModel<typeof message>
export type Node = InferSelectModel<typeof node>
export type NodeInsert = InferInsertModel<typeof node>
export type Notification = InferSelectModel<typeof notification>
export type NotificationInsert = InferInsertModel<typeof notification>
export type Project = InferSelectModel<typeof project>
export type ProjectInsert = InferInsertModel<typeof project>
export type Link = InferSelectModel<typeof link>
export type LinkInsert = InferInsertModel<typeof link>
export type Todo = InferSelectModel<typeof todo>
export type TodoInsert = InferInsertModel<typeof todo>

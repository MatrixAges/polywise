import type { RPCOutput } from '@/types'
import type { FileTreeCompositionOptions, FileTreeMutationEvent, FileTreeRenamingItem } from '@pierre/trees'

export type SkillItem = RPCOutput['skill']['query'][number]
export type SkillFile = {
	name: string
	contents: string
	path: string
} | null

export type DetailMode = 'preview' | 'edit'

export type SkillTreeComposition = FileTreeCompositionOptions
export type SkillTreeMutationEvent = FileTreeMutationEvent
export type SkillTreeRenamingItem = FileTreeRenamingItem

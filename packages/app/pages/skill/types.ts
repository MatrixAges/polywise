import type { RPCOutput } from '@/types'

export type SkillItem = RPCOutput['skill']['query'][number]
export type SkillFile = {
	name: string
	contents: string
	path: string
} | null

export type DetailMode = 'preview' | 'edit'

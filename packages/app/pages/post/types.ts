import type { RPCOutput } from '@/types/rpc'

export type PostForType = 'user' | 'wiki' | 'memory'
export type DetailTab = 'outline' | 'related' | 'session'
export type PostListItem = RPCOutput['post']['query']['list'][number]
export type PostDetail = RPCOutput['post']['read']
export type RelatedArticle = RPCOutput['post']['article']['query'][number]
export type RelatedSearchItem = RPCOutput['post']['article']['search']['list'][number]

export type ListState = {
	list: Array<PostListItem>
	page: number
	has_more: boolean
	loading: boolean
	inited: boolean
}

export type ListStateMap = Record<PostForType, ListState>

export interface AddNodeParams {
	label: string
	x: number
	y: number
	threshold?: number
	idol_id?: string
	root_ids?: string[]
	metrics_ids?: string[]
}

export interface ConnectParams {
	source_id: number
	target_id: number
	weight?: number
	idol_id?: string
	root_ids?: string[]
	metrics_ids?: string[]
}

export interface ProcessArticleParams {
	title: string
	content: string
	triples: import('./polywise').Triple[]
	idol_id?: string
	root_ids?: string[]
	metrics_ids?: string[]
	generate_embedding?: boolean
}

export interface InjectTriplesParams {
	triples: import('./polywise').Triple[]
	article_id: number
	idol_id?: string
	root_ids?: string[]
	metrics_ids?: string[]
}

export interface UpsertNodeParams {
	label: string
	article_id: number
	idol_id?: string
	root_ids?: string[]
	metrics_ids?: string[]
}

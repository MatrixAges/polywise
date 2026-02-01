export interface AddNodeParams {
	// Required Variables
	label: string
	x: number
	y: number

	// Optional Variables
	threshold?: number
	idol_id?: string
	root_ids?: string[]
	metrics_ids?: string[]
}

export interface ConnectParams {
	// Required Variables
	source_id: number
	target_id: number

	// Optional Variables
	weight?: number
	idol_id?: string
	root_ids?: string[]
	metrics_ids?: string[]
}

export interface ProcessArticleParams {
	// Required Variables
	title: string
	content: string
	triples: import('./polywise').Triple[]

	// Optional Variables
	idol_id?: string
	root_ids?: string[]
	metrics_ids?: string[]
	generate_embedding?: boolean
}

export interface InjectTriplesParams {
	// Required Variables
	triples: import('./polywise').Triple[]
	article_id: number

	// Optional Variables
	idol_id?: string
	root_ids?: string[]
	metrics_ids?: string[]
}

export interface UpsertNodeParams {
	// Required Variables
	label: string
	article_id: number

	// Optional Variables
	idol_id?: string
	root_ids?: string[]
	metrics_ids?: string[]
}

export interface AddArticleParams {
	// Required Variables
	title: string
	content: string
}

export interface SearchArticleParams {
	// Required Variables
	query: string

	// Optional Variables
	limit?: number
}

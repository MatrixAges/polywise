export interface BrainArgs {
	poly: import('../Polywise').default
	onTick?: () => void
}

export interface PolywiseArgs {
	data_dir?: string
	embedding_cache_dir?: string
	onTick?: () => void
}

export interface AddNodeArgs {
	label: string
	x: number
	y: number
	threshold?: number
	idol_id?: string
	root_ids?: string[]
	metrics_ids?: string[]
	metadata?: import('./polywise').Metadata
}

export interface ConnectArgs {
	source_id: number
	target_id: number
	weight?: number
	idol_id?: string
	root_ids?: string[]
	metrics_ids?: string[]
	metadata?: import('./polywise').Metadata
}

export interface ProcessArticleArgs {
	title: string
	content: string
	triples: import('./polywise').Triple[]
	idol_id?: string
	root_ids?: string[]
	metrics_ids?: string[]
	generate_embedding?: boolean
}

export interface InjectTriplesArgs {
	triples: import('./polywise').Triple[]
	article_id: number
	idol_id?: string
	root_ids?: string[]
	metrics_ids?: string[]
}

export interface UpsertNodeArgs {
	label: string
	article_id: number
	idol_id?: string
	root_ids?: string[]
	metrics_ids?: string[]
	metadata?: import('./polywise').Metadata
}

export interface AddArticleArgs {
	title: string
	content: string
}

export interface SearchArticleArgs {
	query: string
	limit?: number
}

export interface ArticleArgs {
	db: import('@electric-sql/pglite').PGlite
	embedding_cache_dir?: string
}

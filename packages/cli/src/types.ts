import { PolywiseArgs, ProcessArticleArgs, QueryArgs } from 'polywise'

export interface ServerOptions {
	port: number
	polywise: PolywiseArgs
}

export interface QueryRequest extends Omit<QueryArgs, 'process'> {
	query: string
}

export interface SaveRequest extends Omit<ProcessArticleArgs, 'article_id'> {
	content: string
}

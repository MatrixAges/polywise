import { getKeywords, getRewriteQuery } from '@core/pipeline'
import { log } from '@core/utils'
import { z } from 'zod'

import { input_type } from '../../rpc/search'
import evaluate from './evaluate'
import filterBySemanticSimilarity from './filterBySemanticSimilarity'
import lookup from './lookup'
import recall from './recall'
import rerank, { rerankArticle } from './rerank'
import searchByKeywords from './searchByKeywords'
import searchByVector from './searchByVector'

import type { SearchTarget } from '@core/pipeline/genRewriteQuery'
import type { RerankedArticleResult } from './rerank'

export type ArgsSearch = z.infer<typeof input_type>

export interface ArgsRunPipeline extends ArgsSearch {
	search_target_override?: SearchTarget
	branch_results_override?: BranchResultsOverride
}

export interface BranchResultsOverride {
	keyword_chunk_ids?: Array<string>
	question_chunk_ids?: Array<string>
	answer_chunk_ids?: Array<string>
	recall_chunk_ids?: Array<string>
	recall_article_ids?: Array<string>
}

export interface ChunkResult {
	id: string
	content: string
	score: number
	updated_at: string | null
	scope_type: 'global' | 'project' | 'agent' | null
	scope_id: string | null
}

export type SearchOutput =
	| { type: 'chunk'; results: Array<ChunkResult> }
	| { type: 'article'; results: Array<ChunkResult> }

export interface SearchTargetResult {
	keywords: string
	question: string
	answer: string
	rerank_query: string
}

export interface RecallResult {
	chunk_ids: Array<string>
	article_ids: Array<string>
}

export interface BranchResult {
	chunk_id: string
	rank: number
}

export interface RrfResult {
	chunk_id: string
	rrf_score: number
	normalized_rrf_score: number
	rrf_rank: number
	from_recall: boolean
	from_keyword: boolean
}

export interface FilteredResult extends RrfResult {
	similarity: number
}

export interface ArticleScoreResult {
	article_id: string
	chunk_id: string
	rrf_score: number
	normalized_rrf_score: number
	rrf_rank: number
	from_keyword?: boolean
	updated_at: Date | null
	scope_type: string | null
	scope_id: string | null
}

export interface RunPipelineResult {
	search_target: SearchTargetResult
	recall_result: RecallResult
	keyword_results: Array<BranchResult>
	question_results: Array<BranchResult>
	answer_results: Array<BranchResult>
	rrf_results: Array<RrfResult>
	filtered_results: Array<FilteredResult>
	article_scores: Array<ArticleScoreResult>
	output: SearchOutput
}

interface ArticleSearchResult {
	article_id: string
	rrf_score: number
	normalized_rrf_score: number
	rrf_rank: number
	updated_at: Date | null
	scope_type: string | null
	scope_id: string | null
}

export interface InspectArticleScoreResult {
	article_id: string
	chunk_id: string
	rrf_score: number
	normalized_rrf_score: number
	rrf_rank: number
	from_keyword?: boolean
	updated_at: string | null
	scope_type: string | null
	scope_id: string | null
}

export interface InspectSearchResult {
	search_target: SearchTargetResult
	recall_result: RecallResult
	keyword_results: Array<BranchResult>
	question_results: Array<BranchResult>
	answer_results: Array<BranchResult>
	rrf_results: Array<RrfResult>
	filtered_results: Array<FilteredResult>
	article_scores: Array<InspectArticleScoreResult>
	output: SearchOutput
}

const inspect = async (args: ArgsRunPipeline): Promise<InspectSearchResult> => {
	const {
		query,
		intent,
		enable_rewrite = false,
		enable_recall = false,
		type = 'article',
		for_types,
		scope_type,
		scope_id,
		search_target_override,
		branch_results_override
	} = args

	log('SEARCH', 'start', () => {
		return `query: ${query}, intent: ${intent}, enable_rewrite: ${enable_rewrite}, enable_recall: ${enable_recall}`
	})

	const is_rewrite_mode = enable_rewrite || Boolean(search_target_override)
	let search_keywords = ''
	let search_question = ''
	let search_answer = ''
	let rerank_query = ''

	if (search_target_override) {
		search_keywords = search_target_override.keywords
		search_question = search_target_override.question
		search_answer = search_target_override.answer
		rerank_query = search_target_override.question
	} else if (enable_rewrite) {
		const search_target = await getRewriteQuery(query, intent)

		log('SEARCH', 'getRewriteQuery', () => search_target)

		search_keywords = search_target.keywords
		search_question = search_target.question
		search_answer = search_target.answer
		rerank_query = search_target.question
	} else {
		const combined_query = [query, intent].filter(Boolean).join(' ').trim()
		const keywords_list = await getKeywords(combined_query)

		search_keywords = keywords_list.join(', ')
		search_question = combined_query
		search_answer = ''
		rerank_query = combined_query
	}

	const getBranchResults = (chunk_ids: Array<string>) => {
		return chunk_ids.map((chunk_id, index) => ({
			chunk_id,
			rank: index + 1
		}))
	}

	let recall_result: RecallResult = { chunk_ids: [], article_ids: [] }

	if (branch_results_override?.recall_chunk_ids || branch_results_override?.recall_article_ids) {
		recall_result = {
			chunk_ids: branch_results_override.recall_chunk_ids ?? [],
			article_ids: branch_results_override.recall_article_ids ?? []
		}
	} else if (enable_recall) {
		const recall_text = is_rewrite_mode
			? [search_keywords, search_question].filter(Boolean).join(' ')
			: [query, intent].filter(Boolean).join(' ').trim()

		if (recall_text) {
			recall_result = await recall(recall_text, type)
		}

		log('SEARCH', 'recallDone', () => recall_result)
	}

	const recall_list = recall_result.chunk_ids.map((chunk_id, index) => ({
		chunk_id,
		rank: index + 1
	}))

	const [kw_results, q_results, ans_results]: [Array<BranchResult>, Array<BranchResult>, Array<BranchResult>] =
		await Promise.all([
			branch_results_override?.keyword_chunk_ids
				? Promise.resolve(getBranchResults(branch_results_override.keyword_chunk_ids))
				: search_keywords.trim()
					? searchByKeywords(search_keywords)
					: Promise.resolve([]),
			branch_results_override?.question_chunk_ids
				? Promise.resolve(getBranchResults(branch_results_override.question_chunk_ids))
				: search_question.trim()
					? searchByVector(search_question)
					: Promise.resolve([]),
			branch_results_override?.answer_chunk_ids
				? Promise.resolve(getBranchResults(branch_results_override.answer_chunk_ids))
				: search_answer.trim()
					? searchByVector(search_answer)
					: Promise.resolve([])
		])

	log('SEARCH', 'searchDone', () => ({
		kw_count: kw_results.length,
		q_count: q_results.length,
		ans_count: ans_results.length,
		recall_count: recall_list.length
	}))

	const rrf_results: Array<RrfResult> = evaluate(kw_results, q_results, ans_results, recall_list)

	log('SEARCH', 'rrfDone', () => `result_count: ${rrf_results.length}`)

	const recall_chunk_ids = new Set(recall_result.chunk_ids)
	const filtered_results: Array<FilteredResult> = await filterBySemanticSimilarity(
		rerank_query,
		rrf_results,
		recall_chunk_ids
	)

	log('SEARCH', 'semanticFilterDone', () => `result_count: ${filtered_results.length}`)

	let pipeline_result: RunPipelineResult

	if (type === 'chunk') {
		const reranked = await rerank(rerank_query, filtered_results)

		log('SEARCH', 'done', () => `result_count: ${reranked.length}`)

		const chunk_results: Array<ChunkResult> = reranked.map(item => ({
			id: item.chunk_id,
			content: item.content,
			score: item.final_score,
			updated_at: null,
			scope_type: null,
			scope_id: null
		}))

		const scoped_results = scope_type
			? chunk_results.filter(item => {
					if (item.scope_type === 'global') return true
					if (item.scope_type === scope_type && item.scope_id === scope_id) return true
					return false
				})
			: chunk_results

		pipeline_result = {
			search_target: {
				keywords: search_keywords,
				question: search_question,
				answer: search_answer,
				rerank_query
			},
			recall_result,
			keyword_results: kw_results,
			question_results: q_results,
			answer_results: ans_results,
			rrf_results,
			filtered_results,
			article_scores: [],
			output: {
				type: 'chunk',
				results: scoped_results
			} as SearchOutput
		}
	} else {
		const reranked = await rerank(rerank_query, filtered_results)

		log('SEARCH', 'done', () => `result_count: ${reranked.length}`)

		const article_scores: Array<ArticleScoreResult> = (await lookup(reranked, for_types)).map(item => ({
			article_id: item.article_id,
			chunk_id: item.chunk_id,
			rrf_score: item.rrf_score,
			normalized_rrf_score: item.normalized_rrf_score,
			rrf_rank: item.rrf_rank,
			from_keyword: item.from_keyword,
			updated_at: item.updated_at,
			scope_type: item.scope_type,
			scope_id: item.scope_id
		}))

		log('SEARCH', 'articleLookup', () => `article_count: ${article_scores.length}`)

		if (article_scores.length === 0) {
			pipeline_result = {
				search_target: {
					keywords: search_keywords,
					question: search_question,
					answer: search_answer,
					rerank_query
				},
				recall_result,
				keyword_results: kw_results,
				question_results: q_results,
				answer_results: ans_results,
				rrf_results,
				filtered_results,
				article_scores,
				output: { type: 'article', results: [] } as SearchOutput
			}
		} else {
			const article_search_results: Array<ArticleSearchResult & { from_keyword?: boolean }> =
				article_scores.map(item => ({
					article_id: item.article_id,
					rrf_score: item.rrf_score,
					normalized_rrf_score: item.normalized_rrf_score,
					rrf_rank: item.rrf_rank,
					from_keyword: item.from_keyword,
					updated_at: item.updated_at,
					scope_type: item.scope_type,
					scope_id: item.scope_id
				}))

			const reranked_articles: Array<RerankedArticleResult & { article_id: string }> = await rerankArticle(
				rerank_query,
				article_search_results,
				for_types
			)

			log('SEARCH', 'articleRerankDone', () => `result_count: ${reranked_articles.length}`)

			const final_results: Array<ChunkResult> = reranked_articles.map(item => {
				const valid_scope_type = ['global', 'project', 'agent'].includes(item.scope_type || '')
					? (item.scope_type as 'global' | 'project' | 'agent')
					: null

				return {
					id: item.article_id,
					content: item.content,
					score: item.final_score,
					updated_at: item.updated_at?.toISOString() || null,
					scope_type: valid_scope_type,
					scope_id: item.scope_id
				}
			})

			const scoped_results = scope_type
				? final_results.filter(item => {
						if (item.scope_type === 'global') return true
						if (item.scope_type === scope_type && item.scope_id === scope_id) return true
						return false
					})
				: final_results

			const sorted_results = [...scoped_results].sort((a, b) => b.score - a.score)

			pipeline_result = {
				search_target: {
					keywords: search_keywords,
					question: search_question,
					answer: search_answer,
					rerank_query
				},
				recall_result,
				keyword_results: kw_results,
				question_results: q_results,
				answer_results: ans_results,
				rrf_results,
				filtered_results,
				article_scores,
				output: {
					type: 'article',
					results: sorted_results
				} as SearchOutput
			}
		}
	}

	return {
		search_target: pipeline_result.search_target,
		recall_result: pipeline_result.recall_result,
		keyword_results: pipeline_result.keyword_results,
		question_results: pipeline_result.question_results,
		answer_results: pipeline_result.answer_results,
		rrf_results: pipeline_result.rrf_results,
		filtered_results: pipeline_result.filtered_results,
		article_scores: pipeline_result.article_scores.map(item => ({
			article_id: item.article_id,
			chunk_id: item.chunk_id,
			rrf_score: item.rrf_score,
			normalized_rrf_score: item.normalized_rrf_score,
			rrf_rank: item.rrf_rank,
			from_keyword: item.from_keyword,
			updated_at: item.updated_at?.toISOString() || null,
			scope_type: item.scope_type,
			scope_id: item.scope_id
		})),
		output: pipeline_result.output
	}
}

export default inspect

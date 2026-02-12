import {
	COT_MAX_RESULTS,
	COT_STIMULATE_BASE,
	COT_STIMULATE_FACTOR,
	formatPerceiveQuery,
	MEMORY_RECALL_INTENSITY,
	SEARCH_LIMIT_FACTOR
} from '../consts'
import { aggregateResults } from './aggregation'
import { processResults } from './processResults'

import type Polywise from '@/Polywise'
import type Pipeline from '../Pipeline'
import type { Action, COTDepthResult, ExecuteCotArgs, Knowledge } from '../types'
import type ChainEmitter from './ChainEmitter'

export async function formEmergentQuery(
	args: {
		query: string
		current_depth: number
		initial_knowledges: Array<Knowledge>
		initial_actions: Array<Action>
	},
	stimulateNodes: (node_ids: Array<number>, intensity: number) => Promise<void>
) {
	const { query, current_depth, initial_knowledges, initial_actions } = args

	const top_results = [...initial_knowledges, ...initial_actions].slice(0, COT_MAX_RESULTS)
	const insights = top_results.map(r => r.content.slice(0, 50)).join(', ')
	const emerged_query = formatPerceiveQuery(query, insights)
	const emerged_node_ids = top_results.map(r => r.id)

	await stimulateNodes(emerged_node_ids, COT_STIMULATE_BASE * (1 + current_depth * COT_STIMULATE_FACTOR))

	return emerged_query
}

export async function performEmergentSearch(
	args: {
		emerged_query: string
		current_depth: number
		base_recall_depth: number
		search_limit: number
		stimulate_on_recall: boolean
		history_ids: Set<number>
		idol_id?: string
		root_ids?: Array<string>
	},
	poly: Polywise
) {
	const {
		emerged_query,
		current_depth,
		base_recall_depth,
		search_limit,
		stimulate_on_recall,
		history_ids,
		idol_id,
		root_ids
	} = args

	const depth_recall_depth = base_recall_depth + current_depth
	const query_embedding = (await poly.pipeline.embed(emerged_query)) as Array<number>

	const emerged_recall_result = await poly.recallFromMemory({
		query: emerged_query,
		max_depth: depth_recall_depth,
		stimulate_intensity: stimulate_on_recall ? MEMORY_RECALL_INTENSITY * (1 + current_depth) : 0,
		query_embedding: query_embedding ?? undefined,
		idol_id,
		root_ids
	})

	const emerged_search_results = await poly.pipeline.search({
		query: emerged_query,
		rerank_limit: search_limit * SEARCH_LIMIT_FACTOR,
		vectorSearch: () =>
			poly.article.searchByVector({ query: emerged_query, limit: search_limit * SEARCH_LIMIT_FACTOR }),
		fulltextSearch: () =>
			poly.article.searchByText({ query: emerged_query, limit: search_limit * SEARCH_LIMIT_FACTOR })
	})

	const habits = await poly.getHabits(query_embedding)

	const { knowledges, actions } = await aggregateResults(
		{
			recall_result: emerged_recall_result,
			search_results: emerged_search_results,
			habits
		},
		poly.queryRaw.bind(poly)
	)

	return {
		emerged_knowledges: knowledges.filter(k => !history_ids.has(k.id)),
		emerged_actions: actions.filter(a => !history_ids.has(a.id)),
		emerged_recall_result
	}
}

export async function emitCotResult(args: {
	emitter: ChainEmitter
	emerged_query: string
	reranked_knowledges: Array<Knowledge>
	reranked_actions: Array<Action>
	pipeline: Pipeline
}) {
	const { emitter, emerged_query, reranked_knowledges, reranked_actions, pipeline } = args

	const { knowledges, actions, metadata } = await processResults(
		emerged_query,
		reranked_knowledges,
		reranked_actions,
		pipeline
	)

	const cot_result: COTDepthResult = {
		knowledges,
		actions,
		metadata
	}

	if (emitter.isActiveStatus()) {
		emitter.emit(cot_result)
	}
}

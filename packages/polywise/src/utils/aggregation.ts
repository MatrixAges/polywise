import {
	formatNodeContent,
	HABIT_REACTION_THRESHOLD,
	HABIT_SCORE_BOOST,
	MAX_IMPLICIT_RESULTS,
	MEMORY_SCORE_BOOST,
	POTENTIAL_THRESHOLD,
	RELEVANCE_SCORE_FACTOR
} from '../consts'
import * as sql from '../sql'
import calculateMemoryStrength from './calculateMemoryStrength'

import type { Action, AggregateResultsArgs, Knowledge } from '../types'

export async function aggregateResults(
	args: AggregateResultsArgs,
	queryRaw: (sql: string, params?: any[]) => Promise<any>
) {
	const { recall_result, search_results, habits = [], memory_results = [] } = args

	const knowledges: Knowledge[] = []
	const actions: Action[] = []

	await collectHabitActions(habits, actions, queryRaw)

	collectMemoryKnowledges(recall_result, search_results, knowledges)

	collectExternalResults(recall_result, search_results, knowledges)

	collectImplicitResults(recall_result, knowledges, actions)

	collectMemorySystemResults(memory_results, knowledges)

	return { knowledges, actions }
}

function collectMemorySystemResults(memory_results: Knowledge[], knowledges: Knowledge[]) {
	for (const result of memory_results) {
		knowledges.push(result)
	}
}

async function collectHabitActions(
	habits: any[],
	actions: Action[],
	queryRaw: (sql: string, params?: any[]) => Promise<any>
) {
	for (const stimulus of habits) {
		if (
			stimulus.similarity > HABIT_REACTION_THRESHOLD &&
			(stimulus.activation >= stimulus.threshold || stimulus.potential >= stimulus.threshold)
		) {
			const strong_habits = (await queryRaw(sql.sql_find_strongest_habit, [stimulus.id])) as any[]

			for (const h of strong_habits) {
				actions.push({
					id: h.target_id,
					content: h.action,
					rerankScore: h.weight,
					relevanceScore: h.weight * HABIT_SCORE_BOOST,
					memoryStrength: h.weight,
					combinedScore: 0,
					source: 'memory',
					stimulated: true,
					metadata: h.action_metadata || {}
				})
			}
		}
	}
}

function collectMemoryKnowledges(
	recall_result: AggregateResultsArgs['recall_result'],
	search_results: any[],
	knowledges: Knowledge[]
) {
	for (const context of recall_result.related_contexts) {
		for (const article_id of context.article_ids) {
			const article = search_results.find(r => r.id === article_id)

			if (article) {
				const memory_strength = calculateMemoryStrength(context)

				knowledges.push({
					id: article.id,
					content: article.content,
					rerankScore: article.rerankScore,
					relevanceScore: MEMORY_SCORE_BOOST,
					memoryStrength: memory_strength,
					combinedScore: 0,
					source: 'memory',
					stimulated: true,
					metadata: (article as any).metadata
				})
			}
		}
	}
}

function collectExternalResults(
	recall_result: AggregateResultsArgs['recall_result'],
	search_results: any[],
	knowledges: Knowledge[]
) {
	const stimulated_node_ids = new Set(recall_result.stimulated_nodes)
	const node_potential_map = new Map<number, number>()

	for (const node of recall_result.nodes) {
		node_potential_map.set(node.id, node.potential)
	}

	for (const result of search_results) {
		if (!knowledges.find(c => c.id === result.id)) {
			const is_stimulated = stimulated_node_ids.has(result.id)
			const memory_strength = node_potential_map.get(result.id) ?? 0

			knowledges.push({
				id: result.id,
				content: result.content,
				rerankScore: result.rerankScore,
				relevanceScore: result.rerankScore,
				memoryStrength: memory_strength,
				combinedScore: 0,
				source: is_stimulated ? 'memory' : 'external',
				stimulated: is_stimulated,
				metadata: (result as any).metadata
			})
		}
	}
}

function collectImplicitResults(
	recall_result: AggregateResultsArgs['recall_result'],
	knowledges: Knowledge[],
	actions: Action[]
) {
	const high_potential_nodes = recall_result.nodes
		.filter(
			n =>
				n.potential > POTENTIAL_THRESHOLD &&
				!knowledges.find(k => k.id === n.id) &&
				!actions.find(a => a.id === n.id)
		)
		.slice(0, MAX_IMPLICIT_RESULTS)

	for (const node of high_potential_nodes) {
		const item = {
			id: node.id,
			content: formatNodeContent(node.label, node.metadata?.desc),
			rerankScore: node.potential,
			relevanceScore: node.potential * RELEVANCE_SCORE_FACTOR,
			memoryStrength: node.potential,
			combinedScore: 0,
			source: 'implicit' as any,
			stimulated: true,
			metadata: node.metadata
		}

		if (node.is_action) {
			actions.push(item)
		} else {
			knowledges.push(item)
		}
	}
}

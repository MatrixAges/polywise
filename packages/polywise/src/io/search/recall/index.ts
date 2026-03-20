import { log } from '@core/utils'

import collectNodes from './collectNodes'
import collectRelated from './collectRelated'
import evaluate from './evaluate'
import getSearchKeywords from './getSearchKeywords'

interface RecallResult {
	chunk_ids: string[]
	article_ids: string[]
}

export default async (
	query: string,
	intent?: string,
	searchType: 'chunk' | 'article' = 'article'
): Promise<RecallResult> => {
	const keywords = await getSearchKeywords(query, intent)
	log('SEARCH', 'recall:getSearchKeywords', () => keywords)

	const nodes = await collectNodes(keywords)
	log('SEARCH', 'recall:collectNodes', () => `count: ${nodes.length}`)

	const related_nodes = await collectRelated(nodes)
	log('SEARCH', 'recall:collectRelated', () => `count: ${related_nodes.length}`)

	const all_nodes = [...nodes, ...related_nodes]
	const unique_nodes = all_nodes.filter((n, index, self) => self.findIndex(x => x.id === n.id) === index)
	log('SEARCH', 'recall:mergeNodes', () => `count: ${unique_nodes.length}`)

	const evaluated = evaluate(unique_nodes, searchType)
	log('SEARCH', 'recall:evaluate', () => evaluated)

	return evaluated
}

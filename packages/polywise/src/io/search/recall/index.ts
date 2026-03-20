import { log } from '@core/utils'

import collectNodes from './collectNodes'
import collectRelated from './collectRelated'
import evaluate from './evaluate'
import getSearchKeywords from './getSearchKeywords'

export default async (q: string, intent?: string, type: 'chunk' | 'article' = 'article') => {
	const kw = await getSearchKeywords(q, intent)
	const nodes = await collectNodes(kw)
	const related = collectRelated(nodes)
	const all = [...nodes, ...related].filter((n, i, s) => s.findIndex(x => x.id === n.id) === i)
	const result = evaluate(all, type)

	log('SEARCH', 'recall:done', () => result)
	return result
}

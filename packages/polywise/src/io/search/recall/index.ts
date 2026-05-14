import { log } from '@core/utils'

import collectNodes from './collectNodes'
import collectRelated from './collectRelated'
import evaluate from './evaluate'
import getSearchKeywords from './getSearchKeywords'

export default async (text: string, type: 'chunk' | 'article', depth: number = 2) => {
	const kw = await getSearchKeywords(text)
	const nodes = await collectNodes(kw)

	const related = collectRelated(nodes, depth)

	const all = [...nodes, ...related].filter((n, i, s) => s.findIndex(x => x.id === n.id) === i)

	const result = evaluate(all, type)

	log('SEARCH', 'recall:done', () => result)

	return result
}

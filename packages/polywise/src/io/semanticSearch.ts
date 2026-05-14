import { runSearchPipeline } from './search'
import getSearchText from './search/getSearchText'
import searchByVector from './search/searchByVector'

import type { ArgsSearch, SearchOutput } from './search'

export type { ArgsSearch } from './search'

export default async (args: ArgsSearch): Promise<SearchOutput> => {
	const search_text = getSearchText(args.query, args.intent) || args.query.trim()
	const vector_results = search_text ? await searchByVector(search_text) : []

	const pipeline_result = await runSearchPipeline({
		...args,
		enable_recall: false,
		search_target_override: {
			keywords: '',
			question: search_text,
			answer: ''
		},
		branch_results_override: {
			keyword_chunk_ids: [],
			question_chunk_ids: vector_results.map(item => item.chunk_id),
			answer_chunk_ids: [],
			recall_chunk_ids: [],
			recall_article_ids: []
		}
	})

	return pipeline_result.output
}

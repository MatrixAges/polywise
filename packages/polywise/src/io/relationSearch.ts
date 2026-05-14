import { runSearchPipeline } from './search'
import getSearchText from './search/getSearchText'
import recall from './search/recall'

import type { ArgsSearch, SearchOutput } from './search'

export type { ArgsSearch } from './search'

export default async (args: ArgsSearch): Promise<SearchOutput> => {
	const depth = args.depth ?? 2
	const search_text = getSearchText(args.query, args.intent) || args.query.trim()
	const recall_result = search_text ? await recall(search_text, 'chunk', depth) : { chunk_ids: [], article_ids: [] }

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
			question_chunk_ids: [],
			answer_chunk_ids: [],
			recall_chunk_ids: recall_result.chunk_ids,
			recall_article_ids: recall_result.article_ids
		}
	})

	return pipeline_result.output
}

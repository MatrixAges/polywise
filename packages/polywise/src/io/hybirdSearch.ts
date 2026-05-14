import { runSearchPipeline } from './search'

import type { ArgsSearch, SearchOutput } from './search'

export type { ArgsSearch } from './search'

export default async (args: ArgsSearch): Promise<SearchOutput> => {
	const pipeline_result = await runSearchPipeline({
		...args,
		enable_recall: args.enable_recall ?? true
	})

	return pipeline_result.output
}

import inspect from './inspect'

import type { ArgsSearch, SearchOutput } from './inspect'

export type { ArgsSearch } from './inspect'

export default async (args: ArgsSearch): Promise<SearchOutput> => {
	const pipeline_result = await inspect(args)

	return pipeline_result.output
}

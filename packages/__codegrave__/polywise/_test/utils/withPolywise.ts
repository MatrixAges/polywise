import Polywise from '../../src/Polywise'
import { getTestKeywords, getTestRerank, getTestVectors } from './getCache'
import getDataDir from './getDataDir'

import type { PolywiseArgs } from '../../src/types'

type WithPolywiseArgs = {
	init_args?: PolywiseArgs
	run_fn: (poly: Polywise) => Promise<void>
}

export default async (args: WithPolywiseArgs) => {
	const { init_args, run_fn } = args
	const poly = new Polywise()
	const data_dir = getDataDir()
	const resolved_init_args = {
		...init_args,
		embedding_config: init_args?.embedding_config ?? {
			type: 'custom',
			fn: getTestVectors
		},
		reranker_config: init_args?.reranker_config ?? {
			type: 'custom',
			fn: getTestRerank
		},
		keyword_config: init_args?.keyword_config ?? {
			type: 'custom',
			fn: getTestKeywords
		},
		data_dir
	}

	await poly.init(resolved_init_args)

	try {
		await run_fn(poly)
	} finally {
		await poly.off()
	}
}

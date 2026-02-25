import { describe, expect, it } from '@rstest/core'

import { SCHEMA_MEMORY } from '../src/consts'
import Polywise from '../src/Polywise'
import { sql_insert_context, sql_upsert_context_edge } from '../src/sql'
import generateId from '../src/utils/generateId'
import { getTestKeywords, getTestRerank, getTestVectors } from './utils/getCache'
import getDataDir from './utils/getDataDir'

describe.concurrent('Temporal context prediction', () => {
	const createPoly = async () => {
		const poly = new Polywise()
		const db_name = getDataDir()

		await poly.init({
			data_dir: db_name,
			embedding_config: { type: 'custom', fn: getTestVectors },
			reranker_config: { type: 'custom', fn: getTestRerank },
			keyword_config: { type: 'custom', fn: getTestKeywords }
		})

		return poly
	}

	const createContext = async (poly: Polywise, label: string) => {
		const embedding = (await poly.pipeline.embed(label)) as Array<number>
		const context_id = generateId()
		const embedding_value = `[${embedding.join(',')}]`

		await poly.queryRaw(sql_insert_context, [context_id, embedding_value, [label], 1])

		return context_id
	}

	const addTransition = async (poly: Polywise, source_id: string, target_id: string, count: number) => {
		for (let index = 0; index < count; index++) {
			await poly.queryRaw(sql_upsert_context_edge, [source_id, target_id])
		}
	}

	const setEdgeAgeHours = async (poly: Polywise, source_id: string, target_id: string, hours_ago: number) => {
		await poly.queryRaw(
			`UPDATE ${SCHEMA_MEMORY}.context_edges SET updated_at = NOW() - INTERVAL '${hours_ago} hours' WHERE source_id = $1 AND target_id = $2`,
			[source_id, target_id]
		)
	}

	it('should prefer multi-step prediction when path score is higher', async () => {
		const poly = await createPoly()

		try {
			const context_a = await createContext(poly, 'context_a')
			const context_b = await createContext(poly, 'context_b')
			const context_c = await createContext(poly, 'context_c')
			const context_d = await createContext(poly, 'context_d')

			await addTransition(poly, context_a, context_b, 2)
			await addTransition(poly, context_b, context_c, 6)
			await addTransition(poly, context_a, context_d, 4)

			const poly_access = poly as unknown as {
				last_context_id: string | null
				getSequentialContext: () => Promise<string | null>
			}

			poly_access.last_context_id = context_a

			const predicted = await poly_access.getSequentialContext()

			expect(predicted).toBe(context_c)
		} finally {
			await poly.off()
		}
	})

	it('should down-weight stale transitions across windows', async () => {
		const poly = await createPoly()

		try {
			const context_a = await createContext(poly, 'context_a')
			const context_b = await createContext(poly, 'context_b')
			const context_c = await createContext(poly, 'context_c')

			await addTransition(poly, context_a, context_b, 5)
			await addTransition(poly, context_a, context_c, 3)
			await setEdgeAgeHours(poly, context_a, context_b, 48)

			const poly_access = poly as unknown as {
				last_context_id: string | null
				getSequentialContext: () => Promise<string | null>
			}

			poly_access.last_context_id = context_a

			const predicted = await poly_access.getSequentialContext()

			expect(predicted).toBe(context_c)
		} finally {
			await poly.off()
		}
	})
})

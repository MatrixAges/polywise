import { describe, expect, it } from '@rstest/core'

import Polywise from '../src/Polywise'
import getDataDir from './utils/getDataDir'

describe.concurrent('Context auto resolution', () => {
	const createEmbedding = (index: number) => {
		const embedding = new Array(1024).fill(0)
		embedding[index] = 1

		return embedding
	}

	const createPoly = async () => {
		const poly = new Polywise()
		const db_name = getDataDir()

		await poly.init({
			data_dir: db_name,
			embedding_config: {
				type: 'custom',
				fn: async (text: string) => (text.includes('alpha') ? createEmbedding(0) : createEmbedding(1))
			},
			keyword_config: {
				type: 'custom',
				fn: async (text: string) => (text.includes('alpha') ? ['alpha'] : ['beta'])
			}
		})

		return poly
	}

	it('should assign different contexts for distinct content', async () => {
		const poly = await createPoly()

		try {
			await poly.save({ content: 'alpha memory' })
			await poly.save({ content: 'beta memory' })

			const rows = await poly.db.query<{ context_id: string }>(
				'SELECT context_id FROM memory.articles ORDER BY created_at ASC'
			)

			const first_context = rows.rows[0]?.context_id
			const second_context = rows.rows[1]?.context_id

			expect(first_context).toBeDefined()
			expect(second_context).toBeDefined()
			expect(first_context).not.toBe(second_context)
		} finally {
			await poly.off()
		}
	})
})

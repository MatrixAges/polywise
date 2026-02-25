import { describe, expect, it } from '@rstest/core'

import Polywise from '../src/Polywise'
import { getTestVectors } from './utils/getCache'
import getDataDir from './utils/getDataDir'

describe.concurrent('Context separation', () => {
	const createPoly = async (args: { keyword_list: Array<string>; data_dir: string; context_id?: string }) => {
		const { keyword_list, data_dir, context_id } = args
		const poly = new Polywise()

		await poly.init({
			data_dir,
			context_id,
			embedding_config: { type: 'custom', fn: getTestVectors },
			keyword_config: {
				type: 'custom',
				fn: async () => keyword_list
			}
		})

		return poly
	}

	it('should separate same labels across context ids', async () => {
		const data_dir = getDataDir()
		const keyword_list = ['shared_label', 'context_label']
		const poly_context_a = await createPoly({
			keyword_list,
			data_dir,
			context_id: 'context_a'
		})

		try {
			await poly_context_a.save({ content: 'context A' })
		} finally {
			await poly_context_a.off()
		}

		const poly_context_b = await createPoly({
			keyword_list,
			data_dir,
			context_id: 'context_b'
		})

		try {
			await poly_context_b.save({ content: 'context B' })
		} finally {
			await poly_context_b.off()
		}

		const poly_query_a = await createPoly({
			keyword_list,
			data_dir,
			context_id: 'context_a'
		})

		try {
			const result_a = await poly_query_a.recallFromMemory({
				query: 'shared_label',
				max_depth: 0,
				stimulate_intensity: 0,
				limit: 10
			})

			const poly_query_b = await createPoly({
				keyword_list,
				data_dir,
				context_id: 'context_b'
			})

			try {
				const result_b = await poly_query_b.recallFromMemory({
					query: 'shared_label',
					max_depth: 0,
					stimulate_intensity: 0,
					limit: 10
				})

				const shared_a = result_a.nodes.find(node => node.label === 'shared_label')
				const shared_b = result_b.nodes.find(node => node.label === 'shared_label')

				expect(shared_a).toBeDefined()
				expect(shared_b).toBeDefined()
				expect(shared_a!.id).not.toBe(shared_b!.id)
			} finally {
				await poly_query_b.off()
			}
		} finally {
			await poly_query_a.off()
		}
	})
})

import { describe, expect, it } from '@rstest/core'

import Polywise from '../src/Polywise'
import { getTestVectors } from './utils/getCache'
import getDataDir from './utils/getDataDir'

describe.concurrent('Local competition gating', () => {
	const createPoly = async (keyword_list: Array<string>) => {
		const poly = new Polywise()
		const db_name = getDataDir()

		await poly.init({
			data_dir: db_name,
			embedding_config: { type: 'custom', fn: getTestVectors },
			keyword_config: { type: 'custom', fn: async () => keyword_list }
		})

		return poly
	}

	it('should suppress weak related nodes under strong neighbors', async () => {
		const keyword_list = ['alphas', 'betas']
		const poly = await createPoly(keyword_list)

		try {
			const alpha_label = keyword_list[0]
			const beta_label = keyword_list[1]
			const gamma_label = 'gammas'

			const alpha_id = await poly.addNode({ label: alpha_label, x: 0, y: 0, threshold: 0.1 })
			const beta_id = await poly.addNode({ label: beta_label, x: 10, y: 0, threshold: 0.1 })
			const gamma_id = await poly.addNode({ label: gamma_label, x: 20, y: 0, threshold: 0.1 })

			await poly.connect({ source_id: alpha_id, target_id: beta_id, weight: 1.0 })
			await poly.connect({ source_id: beta_id, target_id: gamma_id, weight: 1.0 })

			await poly.stimulate(beta_id, 2.0)
			await poly.stimulate(gamma_id, 0.1)

			const recall_result = await poly.recallFromMemory({
				query: 'alphas',
				max_depth: 2,
				stimulate_intensity: 0,
				limit: 20
			})

			const labels = recall_result.nodes.map(node => node.label)

			expect(labels).toContain(beta_label)
			expect(labels).not.toContain(gamma_label)
		} finally {
			await poly.off()
		}
	})
})

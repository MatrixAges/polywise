import { describe, expect, it } from '@rstest/core'

import { QUERY_KEYWORDS_LIMIT } from '../src/consts'
import Polywise from '../src/Polywise'
import { cognitive_science_datasets } from './datasets/cognitive'
import getDataDir from './utils/getDataDir'

describe.concurrent('Query keywords use pipeline generation', () => {
	const createPoly = async (keyword_list: Array<string>) => {
		const poly = new Polywise()
		const db_name = getDataDir()

		await poly.init({
			data_dir: db_name,
			keyword_config: {
				type: 'custom',
				fn: async () => keyword_list
			}
		})

		return poly
	}

	it('should recall nodes from pipeline keywords', async () => {
		const keyword_list: Array<string> = [
			'quasar',
			'saffron',
			'obsidian',
			'tachyon',
			'zircon',
			'nebula',
			'pulsar',
			'gabbro',
			'mantis',
			'triton',
			'yarrow',
			'zenith'
		]

		const poly = await createPoly(keyword_list)

		try {
			const query_text = cognitive_science_datasets[0]

			for (let index = 0; index < keyword_list.length; index++) {
				const keyword_label = keyword_list[index]

				await poly.addNode({
					label: keyword_label,
					x: index,
					y: index
				})
			}

			const recall_result = await poly.recallFromMemory({
				query: query_text,
				max_depth: 0,
				limit: 1,
				stimulate_intensity: 0
			})

			expect(recall_result.nodes.length).toBe(QUERY_KEYWORDS_LIMIT)
		} finally {
			await poly.off()
		}
	})
})

import { describe, expect, it } from '@rstest/core'

import Polywise from '../src/Polywise'
import { drm_sets, interference_sets, spacing_sets } from './datasets/paradigms'
import { getTestKeywords, getTestRerank, getTestVectors } from './utils/getCache'
import getDataDir from './utils/getDataDir'

describe.concurrent('Cognitive paradigms', () => {
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

	it('should retrieve spaced sessions for repeated concept', async () => {
		const poly = await createPoly()

		try {
			const spacing = spacing_sets[0]

			for (const session of spacing.sessions) {
				await poly.save({ content: session })
			}

			const result = await poly.query({ query: spacing.query, threshold: 0 })
			const matched = result.memory.filter(item => spacing.sessions.includes(item.text))

			expect(matched.length).toBeGreaterThanOrEqual(2)
		} finally {
			await poly.off()
		}
	})

	it('should surface list items without inserting the DRM lure', async () => {
		const poly = await createPoly()

		try {
			const drm = drm_sets[0]

			for (const item of drm.items) {
				await poly.save({ content: item })
			}

			const result = await poly.query({ query: drm.lure, threshold: 0 })
			const matched = result.memory.filter(item => drm.items.includes(item.text))
			const has_lure = result.memory.some(item => item.text === drm.lure)

			expect(matched.length).toBeGreaterThan(0)
			expect(has_lure).toBe(false)
		} finally {
			await poly.off()
		}
	})

	it('should expose competing memories under interference', async () => {
		const poly = await createPoly()

		try {
			const interference = interference_sets[0]

			for (const fact of interference.facts) {
				await poly.save({ content: fact })
			}

			const result = await poly.query({ query: interference.query, threshold: 0 })
			const matched = result.memory.filter(item => interference.facts.includes(item.text))

			expect(matched.length).toBeGreaterThanOrEqual(2)
		} finally {
			await poly.off()
		}
	})
})

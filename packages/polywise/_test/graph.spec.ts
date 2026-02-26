import { describe, expect, it } from '@rstest/core'

import { cognitive_science_datasets } from './datasets/cognitive'
import { software_architecture_datasets } from './datasets/software'
import withPolywise from './utils/withPolywise'

describe.concurrent('Graph snapshot', () => {
	it('should return snapshot nodes and edges after saves', async () => {
		await withPolywise({
			run_fn: async poly => {
				const contents = software_architecture_datasets.slice(0, 2)

				for (const content of contents) {
					await poly.save({ content })
				}

				const snapshot = await poly.getSnapshot()

				expect(snapshot.nodes.length).toBeGreaterThan(0)
				expect(snapshot.edges.length).toBeGreaterThan(0)
			}
		})
	})

	it('should return related nodes for a snapshot node', async () => {
		await withPolywise({
			run_fn: async poly => {
				const contents = cognitive_science_datasets.slice(0, 3)

				for (const content of contents) {
					await poly.save({ content })
				}

				const snapshot = await poly.getSnapshot()
				const source_id = snapshot.edges[0]?.source_id

				if (!source_id) {
					throw new Error('Snapshot edges missing')
				}

				const related = await poly.getNodeRelated({ node_id: source_id, depth: 1, limit: 20 })

				expect(related.nodes.length).toBeGreaterThan(0)
				expect(related.edges.length).toBeGreaterThan(0)
			}
		})
	})

	it('should bound related nodes by limit', async () => {
		await withPolywise({
			run_fn: async poly => {
				const contents = cognitive_science_datasets.slice(3, 7)

				for (const content of contents) {
					await poly.save({ content })
				}

				const snapshot = await poly.getSnapshot()
				const source_id = snapshot.edges[0]?.source_id

				if (!source_id) {
					throw new Error('Snapshot edges missing')
				}

				const related = await poly.getNodeRelated({ node_id: source_id, depth: 2, limit: 5 })

				expect(related.nodes.length).toBeLessThanOrEqual(5)
			}
		})
	})
})

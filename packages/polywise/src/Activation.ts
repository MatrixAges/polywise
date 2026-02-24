import { injectable } from 'tsyringe'

import Console from './Console'
import { DEFAULT_NODE_THRESHOLD, STRENGTHEN_EDGE_WEIGHT } from './consts'
import { sql_stimulate_nodes_batch, sql_strengthen_edges_batch } from './sql'

import type Polywise from './Polywise'

@injectable()
export default class Activation {
	private p!: Polywise

	init(p: Polywise) {
		this.p = p
	}

	async stimulate(node_ids: Array<string>, intensity: number) {
		if (node_ids.length === 0 || intensity <= 0) {
			return
		}

		Console.log('SYSTEM', 'stimulating nodes', { count: node_ids.length, intensity })

		await this.p.queryRaw(sql_stimulate_nodes_batch, [intensity, node_ids])
	}

	async strengthen(args: { matched_nodes: Array<any>; related_nodes: Array<any> }) {
		const { matched_nodes, related_nodes } = args
		const node_ids = [...matched_nodes, ...related_nodes].map(n => n.id)

		if (node_ids.length < 2) {
			return
		}

		await this.p.queryRaw(sql_strengthen_edges_batch, [STRENGTHEN_EDGE_WEIGHT, node_ids, node_ids])
	}

	async spread(steps = 3, threshold = DEFAULT_NODE_THRESHOLD) {
		Console.log('SYSTEM', 'spreading activation', { steps, threshold })
		for (let i = 0; i < steps; i++) {
			await this.p.tick(threshold)

			if (this.p.onTick) {
				this.p.onTick()
			}
		}
	}
}

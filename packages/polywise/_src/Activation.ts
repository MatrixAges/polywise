import { injectable } from 'tsyringe'

import Console from './Console'
import { DEFAULT_NODE_THRESHOLD, STRENGTHEN_EDGE_WEIGHT } from './consts'
import { sql_stimulate_nodes_batch, sql_strengthen_edges_batch } from './sql'

import type { Node } from './types'

type QueryRaw = <T>(sql: string, params?: Array<unknown>) => Promise<Array<T>>

type ActivationInitArgs = {
	query_raw: QueryRaw
	tick: (threshold_override?: number, is_learning?: boolean, arousal?: number) => Promise<void>
	on_tick?: () => void
}

@injectable()
export default class Activation {
	private query_raw!: QueryRaw
	private tick!: ActivationInitArgs['tick']
	private on_tick?: () => void

	init(args: ActivationInitArgs) {
		const { query_raw, tick, on_tick } = args

		this.query_raw = query_raw
		this.tick = tick
		this.on_tick = on_tick
	}

	async stimulate(node_ids: Array<string>, intensity: number) {
		if (node_ids.length === 0 || intensity <= 0) {
			return
		}

		Console.log('SYSTEM', 'stimulating nodes', { count: node_ids.length, intensity })

		await this.query_raw(sql_stimulate_nodes_batch, [intensity, node_ids])
	}

	async strengthen(args: { matched_nodes: Array<Node>; related_nodes: Array<Node> }) {
		const { matched_nodes, related_nodes } = args
		const node_ids = [...matched_nodes, ...related_nodes].map(n => n.id)

		if (node_ids.length < 2) {
			return
		}

		await this.query_raw(sql_strengthen_edges_batch, [STRENGTHEN_EDGE_WEIGHT, node_ids, node_ids])
	}

	async spread(steps = 3, threshold = DEFAULT_NODE_THRESHOLD, is_learning = false, arousal = 1.0) {
		Console.log('SYSTEM', 'spreading activation', { steps, threshold, is_learning, arousal })
		for (let i = 0; i < steps; i++) {
			await this.tick(threshold, is_learning, arousal)

			if (this.on_tick) {
				this.on_tick()
			}
		}
	}
}

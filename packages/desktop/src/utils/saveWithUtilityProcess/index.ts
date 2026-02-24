import PolySaveUtilityProcess from './polywise'

import type { ProcessArticleArgs, QueryArgs } from 'polywise'

type UpdateArgs = {
	memory_id: string
	content: string
	idol_id?: string
	root_ids?: Array<string>
	metrics_ids?: Array<string>
	metadata?: Record<string, unknown>
}

type ForgetArgs = {
	memory_id?: string
	query?: string
	idol_id?: string
	root_ids?: Array<string>
	metrics_ids?: Array<string>
}

type SnapshotArgs = {
	weight_threshold?: number
	limit?: number
}

type IdolArgs = {
	idol_id: string
}

type RecallArgs = {
	query: string
	max_depth?: number
	idol_id?: string
	root_ids?: Array<string>
	metrics_ids?: Array<string>
	limit?: number
}

type ExpandArgs = {
	node_id: string
	depth?: number
	limit?: number
}

const poly_save_utility_process = new PolySaveUtilityProcess()

const saveWithUtilityProcess = {
	init: async (data_dir: string) => {
		return await poly_save_utility_process.init(data_dir)
	},
	save: async (input: ProcessArticleArgs, data_dir: string) => {
		return (await poly_save_utility_process.save(input, data_dir)) as string
	},
	query: async (input: QueryArgs, data_dir: string) => {
		return await poly_save_utility_process.query(input, data_dir)
	},
	update: async (input: UpdateArgs, data_dir: string) => {
		return (await poly_save_utility_process.update(input, data_dir)) as string
	},
	forget: async (input: ForgetArgs, data_dir: string) => {
		return await poly_save_utility_process.forget(input, data_dir)
	},
	snapshot: async (input: SnapshotArgs, data_dir: string) => {
		return await poly_save_utility_process.snapshot(input, data_dir)
	},
	recall: async (input: RecallArgs, data_dir: string) => {
		return await poly_save_utility_process.recall(input, data_dir)
	},
	expand: async (input: ExpandArgs, data_dir: string) => {
		return await poly_save_utility_process.expand(input, data_dir)
	},
	getNodes: async (data_dir: string) => {
		return await poly_save_utility_process.getNodes(data_dir)
	},
	getNodesByIdol: async (input: IdolArgs, data_dir: string) => {
		return await poly_save_utility_process.getNodesByIdol(input, data_dir)
	},
	getEdgesByIdol: async (input: IdolArgs, data_dir: string) => {
		return await poly_save_utility_process.getEdgesByIdol(input, data_dir)
	}
}

export default saveWithUtilityProcess

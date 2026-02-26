import { Filters, Metadata } from '../types'

export default <T extends Filters & { metadata?: Metadata }>(args: T) => {
	const { root_ids, idol_id, context_id, metadata } = args

	return {
		root_ids: root_ids ?? null,
		idol_id: idol_id ?? null,
		context_id: context_id ?? null,
		metadata: JSON.stringify(metadata ?? {})
	} as unknown as T
}

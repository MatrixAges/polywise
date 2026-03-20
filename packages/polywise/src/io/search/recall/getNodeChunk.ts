import { getNodeChunk } from '@core/db/prepare'

export default (ids: string[]) => {
	if (ids.length === 0) return []

	const params = JSON.stringify(ids)

	return getNodeChunk().all(params) as Array<{ node_id: string; chunk_id: string; article_id: string }>
}

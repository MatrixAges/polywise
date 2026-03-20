import { getNodeByName, getNodeByVector } from '@core/db/prepare'
import { getEmbedding } from '@core/pipeline'

export default async (kw: string) => {
	const kws = kw
		.split(',')
		.map(k => k.trim())
		.filter(Boolean)

	const params = kws.flatMap(k => [`%${k}%`, `%${k}%`])

	const name_results = getNodeByName(kws.length * 2).all(...params) as Array<{
		id: string
		name: string
		rowid: number
	}>

	const vec = await getEmbedding(kws.join(' '))

	const vec_results = getNodeByVector().all(Buffer.from(new Float32Array(vec).buffer)) as Array<{
		id: string
		name: string
		rowid: number
		distance: number
	}>

	const map = new Map<number, { id: string; name: string; rowid: number; similarity: number }>()

	name_results.forEach(i => map.set(i.rowid, { ...i, similarity: 1.0 }))

	vec_results.forEach(i => {
		const sim = 1 - Math.min(i.distance, 1)
		const e = map.get(i.rowid)
		if (!e || sim > e.similarity) map.set(i.rowid, { id: i.id, name: i.name, rowid: i.rowid, similarity: sim })
	})

	return Array.from(map.values())
}

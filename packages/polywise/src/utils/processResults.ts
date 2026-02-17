import type Pipeline from '../Pipeline'
import type { Memory, Metadata } from '../types'

export async function processResults(query: string, memory: Array<Memory>, pipeline: Pipeline) {
	const k_strings = memory.map(k => k.content)

	const descs: Array<string> = []
	const links: Array<string> = []
	const files: Array<string> = []
	const seen_links = new Set<string>()
	const seen_files = new Set<string>()
	const metadata: Metadata = {}

	for (const item of memory) {
		if (item.metadata) {
			const m = item.metadata

			if (m.desc) descs.push(m.desc)

			if (m.links) {
				for (const link of m.links) {
					if (!seen_links.has(link)) {
						seen_links.add(link)
						links.push(link)
					}
				}
			}

			if (m.files) {
				for (const file of m.files) {
					if (!seen_files.has(file)) {
						seen_files.add(file)
						files.push(file)
					}
				}
			}
		}
	}

	const promises: Array<Promise<void>> = []

	if (descs.length > 0) {
		promises.push(
			(async () => {
				const scores = (await pipeline.rerank(query, descs)) as Array<{
					index: number
					score: number
				}>
				const best_index = scores.length > 0 ? scores.sort((a, b) => b.score - a.score)[0].index : 0

				metadata.desc = descs[best_index]
			})()
		)
	}

	if (links.length > 0) {
		promises.push(
			(async () => {
				const scores = (await pipeline.rerank(query, links)) as Array<{
					index: number
					score: number
				}>
				const sorted = scores.sort((a, b) => b.score - a.score).slice(0, 5)

				metadata.links = sorted.map(s => links[s.index])
			})()
		)
	}

	if (files.length > 0) {
		promises.push(
			(async () => {
				const scores = (await pipeline.rerank(query, files)) as Array<{
					index: number
					score: number
				}>
				const sorted = scores.sort((a, b) => b.score - a.score).slice(0, 5)

				metadata.files = sorted.map(s => files[s.index])
			})()
		)
	}

	await Promise.all(promises)

	return {
		memory: k_strings,
		metadata
	}
}

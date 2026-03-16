import { pipeline } from '@core/consts'
import { initEmbeddingModel } from '@core/llama'
import { getEmbedding, getSimilarity, getTokenCount } from '@core/pipeline'

import getOverlapChunks from './getOverlapChunks'
import getRawText from './getRawText'
import processor from './processor'

import type { Heading, Root, RootContent } from 'mdast'

export default async (text: string) => {
	await initEmbeddingModel()

	const tree = processor.parse(text) as Root
	const final_chunks: Array<string> = []

	let current_nodes: Array<RootContent> = []
	let current_tokens = 0
	let last_heading: Heading | null = null
	let anchor_vector: Array<number> | null = null

	const flushBuffer = async () => {
		if (current_nodes.length === 0) return

		const block_text = getRawText(current_nodes, text)
		const is_unbreakable = current_nodes.some(node => pipeline.unbreakable_types.includes(node.type))

		if (current_tokens <= pipeline.max_tokens || is_unbreakable) {
			final_chunks.push(block_text)
		} else {
			const chunks = await getOverlapChunks(block_text)

			final_chunks.push(...chunks)
		}

		current_nodes = []
		current_tokens = 0
		anchor_vector = null
	}

	for (const node of tree.children) {
		if (node.type === 'heading') last_heading = node

		const node_text = getRawText([node], text)

		if (!node_text.trim()) continue

		const node_tokens = getTokenCount(node_text)
		const node_vector = await getEmbedding(node_text)

		const is_overflow = current_tokens + node_tokens > pipeline.max_tokens
		const is_dissimilar =
			current_tokens >= pipeline.min_tokens &&
			anchor_vector &&
			getSimilarity(anchor_vector, node_vector) < pipeline.similarity_threshold

		if (current_nodes.length > 0 && (is_overflow || is_dissimilar)) {
			await flushBuffer()

			if (last_heading && node.type !== 'heading') {
				current_nodes.push(last_heading)

				current_tokens += getTokenCount(getRawText([last_heading], text))
			}
		}

		current_nodes.push(node)
		current_tokens += node_tokens
		anchor_vector ??= node_vector
	}

	await flushBuffer()

	return final_chunks
}

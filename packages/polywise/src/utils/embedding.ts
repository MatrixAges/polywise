import { env, pipeline } from '@huggingface/transformers'

export default async function getEmbedding(text: string, cacheDir?: string): Promise<number[]> {
	if (cacheDir) {
		env.cacheDir = cacheDir
	}

	const extractor = await pipeline('feature-extraction', 'onnx-community/Qwen3-Embedding-0.6B-ONNX', {
		dtype: 'q8'
	})

	const output = await extractor(text, { pooling: 'mean', normalize: true })
	return Array.from(output.data)
}

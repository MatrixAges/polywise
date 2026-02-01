import { env, pipeline } from '@huggingface/transformers'

export default async (text: string, cache_dir?: string) => {
	if (cache_dir) {
		env.cacheDir = cache_dir
	}

	const extractor = await pipeline('feature-extraction', 'onnx-community/Qwen3-Embedding-0.6B-ONNX', {
		dtype: 'q8'
	})

	const output = await extractor(text, { pooling: 'mean', normalize: true })

	return Array.from(output.data)
}

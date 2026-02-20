import os from 'os'
import path from 'path'
import { env, pipeline } from '@huggingface/transformers'

const cache_dir = path.join(os.homedir(), '.polywise', '.models')
env.cacheDir = cache_dir
env.localModelPath = cache_dir
env.allowLocalModels = true

const model_id = 'onnx-community/bge-reranker-v2-m3-ONNX'

const run = async () => {
	console.log('Loading model...')
	const reranker = await pipeline('text-classification', model_id, {
		dtype: 'q8'
	})

	const query = 'Gemini'
	const doc_relevant = '2026年2月19日，Google发布Gemini 3.1 Pro。'
	const doc_irrelevant = '在Anthropic的产品线中，Opus是最强最贵的旗舰...'

	const inputs = [
		{ text: query, text_pair: doc_relevant },
		{ text: query, text_pair: doc_irrelevant }
	]

	console.log('Running inference with default settings...')
	const output_default = await reranker(inputs, {
		top_k: null
	})
	console.log('Default Output:', JSON.stringify(output_default, null, 2))

	console.log("Running inference with function_to_apply: 'none'...")
	// Try to pass function_to_apply in options.
	// If this fails, we will know.
	try {
		const output_none = await reranker(inputs, {
			top_k: null,
			function_to_apply: 'none'
		})
		console.log('None Output:', JSON.stringify(output_none, null, 2))
	} catch (e) {
		console.log("Error with function_to_apply: 'none'", e)
	}
}

run()

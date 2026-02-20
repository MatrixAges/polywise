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

	const texts = [query, query]
	const text_pairs = [doc_relevant, doc_irrelevant]

	console.log('Tokenizing...')
	const encoded = await reranker.tokenizer(texts, {
		text_pair: text_pairs,
		padding: true,
		truncation: true,
		max_length: 512
	})

	console.log('Running model forward pass...')
	const output = await reranker.model(encoded)

	console.log('Raw Logits Data:', output.logits.data)
}

run()

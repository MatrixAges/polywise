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

	const doc_gemini_benchmark =
		"在两项关键基准测试中，Gemini 3.1 Pro呈现显著性能提升。ARC-AGI-2测试得分77.1%，较Gemini 3 Pro的31.1%提升超过一倍。在Humanity's Last Exam测试中，Gemini 3.1 Pro得分44.4%，高于Gemini 3 Pro的37.5%和GPT-5.2的34.5%。"
	const doc_gemini_release =
		'2026年2月19日，Google发布Gemini 3.1 Pro。这是Google首次以".1"作为版本增量发布Gemini模型——此前的版本迭代均为0.5递进（1.0→1.5→2.0→2.5→3.0）。'
	const doc_qwen =
		'Qwen3.5-Plus 总参数 3970 亿，但推理时仅激活 170 亿，以不到 5% 的参数撬动了全部智能。在多项基准测试中性能媲美GPT-5.2、Gemini-3-pro等闭源第一梯队模型，甚至超越了自家上一代万亿参数的Qwen3-Max。'

	const cases = [
		{ query: 'Gemini', doc: doc_gemini_benchmark, label: 'Gemini -> Benchmark' },
		{ query: 'Gemini 3 pro', doc: doc_gemini_benchmark, label: 'Gemini 3 pro -> Benchmark' },
		{ query: 'Gemini 3 pro', doc: doc_qwen, label: 'Gemini 3 pro -> Qwen' },
		{ query: 'Gemini 3 pro', doc: doc_gemini_release, label: 'Gemini 3 pro -> Release' }
	]

	console.log('Tokenizing...')
	const encoded = await reranker.tokenizer(
		cases.map(c => c.query),
		{
			text_pair: cases.map(c => c.doc),
			padding: true,
			truncation: true,
			max_length: 512
		}
	)

	console.log('Running model forward pass...')
	const output = await reranker.model(encoded)
	const logits = output.logits.data

	console.log('\nResults:')
	for (let i = 0; i < cases.length; i++) {
		const logit = logits[i]
		const score = 1 / (1 + Math.exp(-logit))
		console.log(`\nCase: ${cases[i].label}`)
		console.log(`Logit: ${logit}`)
		console.log(`Sigmoid Score: ${score.toFixed(4)}`)
	}
}

run()

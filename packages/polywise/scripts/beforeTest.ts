import 'reflect-metadata'

import path from 'path'
import fs from 'fs-extra'
import { container } from 'tsyringe'

import Pipeline from '../src/Pipeline'
import { behavioral_knowledge, behavioral_qa } from '../test/datasets/behavioral'
import { cognitive_science_datasets } from '../test/datasets/cognitive'
import { process_test_cases } from '../test/datasets/process'
import { software_architecture_datasets } from '../test/datasets/software'
import { getTestKeywords, getTestVectors } from '../test/utils/getCache'

async function beforeTest() {
	const pipeline = container.resolve(Pipeline)
	await pipeline.init({
		embedding_concurrency: 20,
		reranker_concurrency: 20,
		rebel_concurrency: 10
	})
	await pipeline.checkModels()
	console.log('All models are ready.')

	console.log('Pre-warming test cache...')

	const datasets_dir = path.resolve(__dirname, '../test/datasets/text')

	const chunkText = (text: string, size = 1000) => {
		const chunks: Array<string> = []
		let start = 0
		while (start < text.length) {
			chunks.push(text.slice(start, start + size))
			start += size
		}
		return chunks
	}

	const loadDataset = async (name: string) => {
		const filePath = path.join(datasets_dir, `${name}.txt`)
		return await fs.readFile(filePath, 'utf-8')
	}

	const targeted_chunks: Array<string> = []

	const lit_text = await loadDataset('complex_literature')
	targeted_chunks.push(...chunkText(lit_text, 1500).slice(0, 10))

	const neuro_text = await loadDataset('neuroscience')
	targeted_chunks.push(`Neuroscience Overview: ${neuro_text.slice(0, 5000)}`)

	const phil_text = await loadDataset('philosophy')
	targeted_chunks.push(`Philosophy Overview: ${phil_text.slice(0, 5000)}`)

	const ai_text = await loadDataset('ai_research')
	targeted_chunks.push(...chunkText(ai_text, 1200).slice(0, 10))

	const legal_text = await loadDataset('legal')
	targeted_chunks.push(`Legal Foundations: ${legal_text.slice(0, 8000)}`)

	const physics_text = await loadDataset('physics')
	targeted_chunks.push(`Physics Principles: ${physics_text.slice(0, 8000)}`)

	console.log(`  Embedding ${targeted_chunks.length} targeted data chunks...`)
	for (const chunk of targeted_chunks) {
		await getTestVectors(chunk)
		process.stdout.write('.')
	}

	const all_texts = [
		...cognitive_science_datasets,
		...software_architecture_datasets,
		...behavioral_knowledge,
		...behavioral_qa.map(q => q.question),
		...process_test_cases.map(c => c.query),
		'init',
		'test',
		'query'
	]

	console.log(`\n  Embedding ${all_texts.length} short snippets...`)
	const chunk_size = 20
	for (let i = 0; i < all_texts.length; i += chunk_size) {
		const chunk = all_texts.slice(i, i + chunk_size)
		await Promise.all(chunk.map(text => getTestVectors(text)))
		process.stdout.write('.')
	}

	console.log('\nAll datasets are ready.')

	// Pre-generate keywords cache for test datasets (only first 5 from each to save time)
	console.log('Pre-warming keywords cache...')
	const keyword_texts = [...cognitive_science_datasets.slice(0, 5), ...software_architecture_datasets.slice(0, 5)]
	console.log(`  Generating keywords from ${keyword_texts.length} documents...`)
	const keyword_chunk_size = 5
	for (let i = 0; i < keyword_texts.length; i += keyword_chunk_size) {
		const chunk = keyword_texts.slice(i, i + keyword_chunk_size)
		await Promise.all(chunk.map(text => getTestKeywords(text)))
		process.stdout.write('.')
	}
	console.log('\nKeywords cache ready.')
}

beforeTest().catch(err => {
	console.error('Failed to check models:', err)
	process.exit(1)
})

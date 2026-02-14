import 'reflect-metadata'

import fs from 'fs/promises'
import path from 'path'
import { container } from 'tsyringe'

import Pipeline from '../src/Pipeline'
import { behavioral_knowledge, behavioral_qa } from '../test/datasets/behavioral'
import { cognitive_science_datasets } from '../test/datasets/cognitive'
import * as decision_datasets from '../test/datasets/decision'
import { process_test_cases } from '../test/datasets/process'
import { software_architecture_datasets } from '../test/datasets/software'
import { getTestDecision, getTestVectors } from '../test/utils/getCache'

async function beforeTest() {
	const pipeline = container.resolve(Pipeline)
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

	const static_prompts = [
		decision_datasets.prompt_load_test,
		decision_datasets.prompt_fruits_list,
		decision_datasets.prompt_boolean_logic,
		decision_datasets.prompt_temporal_logic,
		decision_datasets.prompt_category_apple,
		decision_datasets.prompt_synonyms,
		decision_datasets.prompt_sentiment,
		decision_datasets.prompt_negative_constraints,
		decision_datasets.prompt_json_format,
		decision_datasets.prompt_single_number,
		decision_datasets.prompt_sky_color,
		decision_datasets.prompt_causality,
		decision_datasets.prompt_harmful
	]

	console.log(`\n  Embedding ${static_prompts.length} decision prompts...`)
	for (const prompt of static_prompts) {
		await getTestDecision(prompt, {})
		process.stdout.write('.')
	}

	const dynamic_decision_inputs = [
		...behavioral_knowledge.slice(0, 5).map(c => decision_datasets.prompt_assess_content(c)),
		decision_datasets.prompt_memory_relationship('I like Blue.', 'I like Blue.'),
		decision_datasets.prompt_memory_relationship('My name is John.', 'I am John.'),
		decision_datasets.prompt_memory_relationship('I live in London.', 'I moved to Paris.'),
		decision_datasets.prompt_memory_relationship('I like apples.', 'The sky is blue.'),
		decision_datasets.prompt_summarize_text('The sky is blue and clear today.')
	]

	console.log(`\n  Embedding ${dynamic_decision_inputs.length} dynamic_decision_inputs prompts...`)
	for (const prompt of dynamic_decision_inputs) {
		await getTestDecision(prompt, {})
		process.stdout.write('.')
	}

	console.log('\nAll datasets are ready.')
}

beforeTest().catch(err => {
	console.error('Failed to check models:', err)
	process.exit(1)
})

import path from 'path'
import fs from 'fs-extra'
import { ofetch } from 'ofetch'

const DATASETS = [
	{
		name: 'neuroscience',
		raw_urls: [
			'https://en.wikipedia.org/wiki/Neuroscience?action=raw',
			'https://en.wikipedia.org/wiki/Cognitive_neuroscience?action=raw',
			'https://en.wikipedia.org/wiki/Neurobiology?action=raw'
		]
	},
	{
		name: 'computer_science',
		raw_urls: [
			'https://en.wikipedia.org/wiki/Operating_system?action=raw',
			'https://en.wikipedia.org/wiki/Database?action=raw',
			'https://en.wikipedia.org/wiki/Distributed_computing?action=raw',
			'https://en.wikipedia.org/wiki/Concurrency_(computer_science)?action=raw'
		]
	},
	{
		name: 'philosophy',
		raw_urls: [
			'https://en.wikipedia.org/wiki/Epistemology?action=raw',
			'https://en.wikipedia.org/wiki/Metaphysics?action=raw',
			'https://en.wikipedia.org/wiki/Phenomenology_(philosophy)?action=raw',
			'https://en.wikipedia.org/wiki/Existentialism?action=raw'
		]
	},
	{
		name: 'legal',
		raw_urls: [
			'https://en.wikipedia.org/wiki/Common_law?action=raw',
			'https://en.wikipedia.org/wiki/Constitutional_law?action=raw',
			'https://en.wikipedia.org/wiki/International_law?action=raw'
		]
	},
	{
		name: 'physics',
		raw_urls: [
			'https://en.wikipedia.org/wiki/Quantum_mechanics?action=raw',
			'https://en.wikipedia.org/wiki/General_relativity?action=raw',
			'https://en.wikipedia.org/wiki/Particle_physics?action=raw'
		]
	},
	{
		name: 'scientific_arxiv',
		raw_urls: [
			'https://raw.githubusercontent.com/mattbierbaum/arxiv-public-datasets/master/arxiv-metadata-oai-snapshot.json' // This is JSON, I'll need to parse it or just use it as complex text
		]
	},
	{
		name: 'complex_literature',
		raw_urls: [
			'https://www.gutenberg.org/files/1342/1342-0.txt', // Pride and Prejudice
			'https://www.gutenberg.org/files/11/11-0.txt' // Alice in Wonderland
		]
	},
	{
		name: 'ai_research',
		raw_urls: [
			'https://en.wikipedia.org/wiki/Large_language_model?action=raw',
			'https://en.wikipedia.org/wiki/Transformer_(deep_learning_architecture)?action=raw',
			'https://en.wikipedia.org/wiki/Generative_artificial_intelligence?action=raw'
		]
	}
]

const OUTPUT_DIR = path.resolve(__dirname, '../test/datasets/text')

async function cleanText(text: string) {
	return text
		.replace(/\{\{[^}]*\}\}/g, '') // Remove wiki templates
		.replace(/\[\[([^|\]]*)\|?([^\]]*)\]\]/g, '$2') // Simplify wiki links
		.replace(/==+([^=]+)==+/g, '\n$1\n') // Headers
		.replace(/<[^>]*>/g, '') // Remove HTML tags
		.replace(/\n\s*\n/g, '\n\n') // Normalize newlines
		.trim()
}

async function fetchAndSave() {
	await fs.ensureDir(OUTPUT_DIR)

	for (const dataset of DATASETS) {
		console.log(`Fetching ${dataset.name}...`)
		let combined_text = ''

		for (const url of dataset.raw_urls) {
			try {
				const response = await ofetch(url, { parseResponse: txt => txt })
				combined_text += response + '\n\n'
			} catch (e) {
				console.error(`Failed to fetch ${url}:`, e)
			}
		}

		const cleaned = await cleanText(combined_text)
		const filePath = path.join(OUTPUT_DIR, `${dataset.name}.txt`)
		await fs.writeFile(filePath, cleaned, 'utf-8')
		console.log(`Saved ${dataset.name} to ${filePath} (${cleaned.length} chars)`)
	}
}

fetchAndSave().catch(console.error)

import { Jieba } from '@node-rs/jieba'
import { dict } from '@node-rs/jieba/dict.js'
import { eng, zho } from 'stopword'

import Console from '../Console'

// Initialize jieba globally
const jieba = Jieba.withDict(dict)

// Stopwords lists
const STOPWORDS = new Set([...zho, ...eng])

// POS tags that are considered "Noun-like" or "Entity-like"
// n: noun, nr: person, ns: place, nt: org, nz: proper noun, eng: english
// vn: gerund, an: adjectival noun, l: idiom
const VALID_ENTITY_TAGS = new Set(['n', 'nr', 'ns', 'nt', 'nz', 'eng', 'vn', 'an', 'l', 'j', 'i'])

// POS tags that are definitely noise for memory nodes
const BLACKLIST_TAGS = new Set([
	'v', // verb
	'd', // adverb
	'm', // numeral
	'q', // quantity
	't', // time
	'f', // direction
	's', // space
	'r', // pronoun
	'p', // preposition
	'c', // conjunction
	'u', // auxiliary
	'xc', // other
	'w', // punctuation
	'x', // non-word
	'zg' // indicator/other
])

function cosineSimilarity(vecA: number[], vecB: number[]) {
	const dotProduct = vecA.reduce((acc, val, i) => acc + val * vecB[i], 0)
	const normA = Math.sqrt(vecA.reduce((acc, val) => acc + val * val, 0))
	const normB = Math.sqrt(vecB.reduce((acc, val) => acc + val * val, 0))
	return dotProduct / (normA * normB)
}

function generateCandidates(text: string): string[] {
	// Segment words with POS tagging
	const taggedWords = jieba.tag(text)

	const ngrams: string[] = []

	// 1-grams: Must be a valid entity/noun
	for (const t of taggedWords) {
		const word = t.word.trim()
		if (word.length < 2 && t.tag !== 'eng') continue // Skip single-char non-english
		if (STOPWORDS.has(word.toLowerCase())) continue
		if (VALID_ENTITY_TAGS.has(t.tag)) {
			ngrams.push(word)
		}
	}

	// 2-grams: Must not contain stopwords, and should follow "Noun-centric" boundary rules
	// Rule: A 2-gram should ideally end with a noun/entity.
	for (let i = 0; i < taggedWords.length - 1; i++) {
		const t1 = taggedWords[i]
		const t2 = taggedWords[i + 1]

		const word1 = t1.word.trim()
		const word2 = t2.word.trim()

		if (word1.length < 1 || word2.length < 1) continue
		if (STOPWORDS.has(word1.toLowerCase()) || STOPWORDS.has(word2.toLowerCase())) continue

		// Boundary POS check
		// Start should not be a "hard noise" tag
		if (BLACKLIST_TAGS.has(t1.tag)) continue

		// End MUST be a valid entity tag (Noun/Eng/etc.)
		if (!VALID_ENTITY_TAGS.has(t2.tag)) continue

		ngrams.push(`${word1}${word2}`)
	}

	return [...new Set(ngrams)]
}

const extract = async (
	text: string,
	extractor: any,
	topK: number = 5
): Promise<Array<{ word: string; score: number }>> => {
	if (!text.trim()) return []

	const candidates = generateCandidates(text)
	if (candidates.length === 0) return []

	Console.log('PIPELINE', 'KeyBERT extract candidates', {
		text_len: text.length,
		candidates_count: candidates.length
	})

	const inputs = [text, ...candidates]

	const output = await extractor(inputs, {
		pooling: 'mean',
		normalize: true
	})

	const embeddings = output.tolist()
	const docEmbedding = embeddings[0]
	const candidateEmbeddings = embeddings.slice(1)

	const results = candidates.map((candidate, i) => {
		const score = cosineSimilarity(docEmbedding, candidateEmbeddings[i])
		return { word: candidate, score }
	})

	return results.sort((a, b) => b.score - a.score).slice(0, topK)
}

export default { extract }

import { Jieba } from '@node-rs/jieba'
import { dict } from '@node-rs/jieba/dict.js'
import { eng, zho } from 'stopword'

import Console from '../Console'

import type { Extractor, KeywordScore, TaggedWord } from '../types'

const jieba_instance = Jieba.withDict(dict)

const stopword_set = new Set([...zho, ...eng])
const valid_entity_tag_set = new Set(['n', 'nr', 'ns', 'nt', 'nz', 'eng', 'vn', 'an', 'l', 'j', 'i'])
const blacklist_tag_set = new Set(['v', 'd', 'm', 'q', 't', 'f', 's', 'r', 'p', 'c', 'u', 'xc', 'w', 'x', 'zg'])

const cosineSimilarity = (vec_a: Array<number>, vec_b: Array<number>) => {
	const dot_product = vec_a.reduce((acc, val, index) => acc + val * vec_b[index], 0)
	const norm_a = Math.sqrt(vec_a.reduce((acc, val) => acc + val * val, 0))
	const norm_b = Math.sqrt(vec_b.reduce((acc, val) => acc + val * val, 0))

	if (!norm_a || !norm_b) return 0
	return dot_product / (norm_a * norm_b)
}

const isValidUnigram = (tagged_word: TaggedWord) => {
	const word_text = tagged_word.word.trim()
	if (!word_text) return false
	if (word_text.length < 2 && tagged_word.tag !== 'eng') return false
	if (stopword_set.has(word_text.toLowerCase())) return false
	return valid_entity_tag_set.has(tagged_word.tag)
}

const isValidBigram = (first_word: TaggedWord, second_word: TaggedWord) => {
	const word_1 = first_word.word.trim()
	const word_2 = second_word.word.trim()

	if (!word_1 || !word_2) return false
	if (stopword_set.has(word_1.toLowerCase()) || stopword_set.has(word_2.toLowerCase())) return false
	if (blacklist_tag_set.has(first_word.tag)) return false
	return valid_entity_tag_set.has(second_word.tag)
}

const generateCandidates = (text: string) => {
	const tagged_word_list = jieba_instance.tag(text) as Array<TaggedWord>
	const ngram_list: Array<string> = []

	tagged_word_list.forEach(tagged_word => {
		if (!isValidUnigram(tagged_word)) return
		ngram_list.push(tagged_word.word.trim())
	})

	for (let index = 0; index < tagged_word_list.length - 1; index += 1) {
		const first_word = tagged_word_list[index]
		const second_word = tagged_word_list[index + 1]
		if (!isValidBigram(first_word, second_word)) continue
		ngram_list.push(`${first_word.word.trim()}${second_word.word.trim()}`)
	}

	return Array.from(new Set(ngram_list))
}

const extract = async (text: string, extractor: Extractor, top_k = 5) => {
	const clean_text = text.trim()
	if (!clean_text) return []

	const candidate_list = generateCandidates(clean_text)
	if (!candidate_list.length) return []

	Console.log('PIPELINE', 'KeyBERT extract candidates', {
		text_len: clean_text.length,
		candidates_count: candidate_list.length
	})

	const input_list = [clean_text, ...candidate_list]

	const output = await extractor(input_list, {
		pooling: 'mean',
		normalize: true
	})

	const embedding_list = output.tolist()
	const doc_embedding = embedding_list[0]
	const candidate_embedding_list = embedding_list.slice(1)

	const result_list: Array<KeywordScore> = candidate_list.map((candidate_word, index) => {
		const score = cosineSimilarity(doc_embedding, candidate_embedding_list[index])
		return { word: candidate_word, score }
	})

	return result_list.sort((a, b) => b.score - a.score).slice(0, top_k)
}

export default { extract }

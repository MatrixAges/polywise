import { eng, zho } from 'stopword'

import isValidBigram from './isValidBigram'
import isValidUnigram from './isValidUnigram'
import jieba from './jieba'

export interface Word {
	word: string
	tag: string
}

export const stopword_set = new Set([...zho, ...eng])
export const valid_entity_tag_set = new Set(['n', 'nr', 'ns', 'nt', 'nz', 'eng', 'vn', 'an', 'l', 'j', 'i'])
export const blacklist_tag_set = new Set(['v', 'd', 'm', 'q', 't', 'f', 's', 'r', 'p', 'c', 'u', 'xc', 'w', 'x', 'zg'])

const extractEnglishPhrases = (text: string): Array<string> => {
	const phrases: Array<string> = []

	const patterns = [
		/[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+/g,
		/[A-Z]{2,}(?:\s+[A-Z][a-z]+)+/g,
		/[A-Z][a-z]*[-_][A-Za-z0-9]+/g,
		/[A-Z]{2,}/g,
		/\d+[\-_.]?\w+/g
	]

	patterns.forEach(pattern => {
		const matches = text.match(pattern)
		if (matches) {
			matches.forEach(match => {
				const clean = match.trim()
				if (clean.length >= 2 && !stopword_set.has(clean.toLowerCase())) {
					phrases.push(clean)
				}
			})
		}
	})

	return phrases
}

export default async (text: string) => {
	const tagged_word_list = (await jieba.tag(text)) as Array<Word>
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

		if (index < tagged_word_list.length - 2) {
			const third_word = tagged_word_list[index + 2]

			if (isValidBigram(second_word, third_word)) {
				ngram_list.push(`${first_word.word.trim()}${second_word.word.trim()}${third_word.word.trim()}`)
			}
		}
	}

	const english_phrases = extractEnglishPhrases(text)
	ngram_list.push(...english_phrases)

	return Array.from(new Set(ngram_list))
}

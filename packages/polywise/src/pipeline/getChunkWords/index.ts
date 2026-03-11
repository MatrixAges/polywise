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

export default (text: string) => {
	const tagged_word_list = jieba.tag(text) as Array<Word>
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

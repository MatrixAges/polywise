import { eng, zho } from 'stopword'

import isCleanWord from './isCleanWord'
import jieba from './jieba'

interface Word {
	word: string
	tag: string
}

const stopword_set = new Set([...zho, ...eng])
const valid_entity_tag_set = new Set(['n', 'nr', 'ns', 'nt', 'nz', 'eng', 'vn', 'an', 'l', 'j', 'i'])
const blacklist_tag_set = new Set(['v', 'd', 'm', 'q', 't', 'f', 's', 'r', 'p', 'c', 'u', 'xc', 'w', 'x', 'zg'])

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

const isValidUnigram = (tagged_word: Word) => {
	const word_text = tagged_word.word.trim()

	if (!isCleanWord(word_text)) return false

	if (word_text.length < 2 && tagged_word.tag !== 'eng') return false
	if (stopword_set.has(word_text.toLowerCase())) return false

	return valid_entity_tag_set.has(tagged_word.tag)
}

const isValidBigram = (first_word: Word, second_word: Word) => {
	const word_1 = first_word.word.trim()
	const word_2 = second_word.word.trim()

	if (!isCleanWord(word_1) || !isCleanWord(word_2)) return false

	if (stopword_set.has(word_1.toLowerCase()) || stopword_set.has(word_2.toLowerCase())) return false
	if (blacklist_tag_set.has(first_word.tag)) return false

	return valid_entity_tag_set.has(second_word.tag)
}

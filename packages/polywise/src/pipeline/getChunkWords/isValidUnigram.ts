import { stopword_set, valid_entity_tag_set } from './index'
import isCleanWord from './isCleanWord'

import type { Word } from './index'

export default (tagged_word: Word) => {
	const word_text = tagged_word.word.trim()

	if (!isCleanWord(word_text)) return false

	if (word_text.length < 2 && tagged_word.tag !== 'eng') return false
	if (stopword_set.has(word_text.toLowerCase())) return false

	if (valid_entity_tag_set.has(tagged_word.tag)) return true

	if (/[a-zA-Z]/.test(word_text) && word_text.length >= 2) return true

	return false
}

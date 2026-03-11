import { blacklist_tag_set, stopword_set, valid_entity_tag_set } from './index'
import isCleanWord from './isCleanWord'

import type { Word } from './index'

export default (first_word: Word, second_word: Word) => {
	const word_1 = first_word.word.trim()
	const word_2 = second_word.word.trim()

	if (!isCleanWord(word_1) || !isCleanWord(word_2)) return false

	if (stopword_set.has(word_1.toLowerCase()) || stopword_set.has(word_2.toLowerCase())) return false
	if (blacklist_tag_set.has(first_word.tag)) return false

	return valid_entity_tag_set.has(second_word.tag)
}

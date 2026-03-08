import { Jieba } from '@node-rs/jieba'
import { dict } from '@node-rs/jieba/dict'
import { eng, removeStopwords, zho } from 'stopword'

const jieba = Jieba.withDict(dict)

export default (v: string) => {
	const words = jieba.cut(v, true)
	const cleanWords = removeStopwords(words, [...zho, ...eng])

	return cleanWords
		.filter(word => {
			const trimmed = word.trim()

			return trimmed.length > 0 && /^[\u4e00-\u9fa5a-zA-Z0-9]+$/.test(trimmed)
		})
		.join(' ')
}

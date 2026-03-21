import { Jieba } from '@node-rs/jieba'
import { dict } from '@node-rs/jieba/dict.js'

let jieba: Jieba | null = null

export default (text: string) => {
	if (!jieba) jieba = Jieba.withDict(dict)

	return jieba.tag(text)
}

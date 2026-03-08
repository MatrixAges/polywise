import { Jieba } from '@node-rs/jieba'
import { dict } from '@node-rs/jieba/dict.js'

export default Jieba.withDict(dict)

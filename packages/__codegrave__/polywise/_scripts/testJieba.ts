import 'reflect-metadata'

import { Jieba } from '@node-rs/jieba'
import { dict } from '@node-rs/jieba/dict'

import Pipeline from '../src/Pipeline'
import KeyBERT from '../src/utils/KeyBERT'

const text =
	'今天纽约的天气真好啊，京华大酒店的张尧经理吃了一只北京烤鸭。后天纽约的天气不好，昨天纽约的天气也不好，北京烤鸭真好吃。Clawbot 是未来，直言 MiniMax'

async function run() {
	const jieba = Jieba.withDict(dict)

	console.log('--- Raw Jieba Tags ---')
	console.log(jieba.tag(text))

	const pipeline = new Pipeline()
	await pipeline.init()
	const extractor = await pipeline.loadEmbeddingModel()

	console.log('\n--- KeyBERT Extractor Output ---')
	const keywords = await KeyBERT.extract(text, extractor, 10)
	console.log(keywords)
}

run()

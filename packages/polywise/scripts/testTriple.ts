import 'reflect-metadata'

import { container } from 'tsyringe'

import { splitSentence } from '@/utils'

import Pipeline from '../src/Pipeline'
import { cognitive_science_datasets } from '../test/datasets/cognitive'
import { software_architecture_datasets } from '../test/datasets/software'

async function testTriple() {
	console.log('Initializing Pipeline...')
	const pipeline = container.resolve(Pipeline)
	await pipeline.init({
		embedding_concurrency: 20,
		reranker_concurrency: 20,
		rebel_concurrency: 10
	})

	console.log('Checking models...')
	await pipeline.checkModels()
	console.log('Models ready.')

	const testTexts = [
		// cognitive_science_datasets[0],
		// software_architecture_datasets[0],
		`人工智能（AI）是当前最前沿的科技领域之一，它正在深刻地改变着人类社会的生产与生活方式。自1956年达特茅斯会议首次提出该概念以来，AI经历了多次起伏；直到近年来，得益于深度学习技术的突破，如GPT-4等大型语言模型的出现，这一领域才迎来爆发式增长。目前，许多公司（如Google、OpenAI和Baidu）都在投入重金研发相关算法。与此同时，研究人员也在思考：AI是否会超越人类智能？这是一个值得讨论的问题。此外，在处理1.5倍速视频或U.S.A.相关的国际新闻时，AI展现出了惊人的效率！你准备好迎接这个挑战了吗？
`
	]
	const sentences = await splitSentence(testTexts)
	// const test_sentence = sentences.at(-1)!

	// console.log(test_sentence)

	// const startTime = Date.now()

	// const triples = await pipeline.extractTriples(test_sentence)

	// const duration = Date.now() - startTime

	await Promise.all(
		sentences.map(async item => {
			const startTime = Date.now()

			const triples = await pipeline.extractTriples(item)

			const duration = Date.now() - startTime

			console.log('-----------')
			console.log(`Input: ${item}`)
			console.log(`Output: ${triples}`)
			console.log(`Duration: ${duration}`)
		})
	)

	console.log('\nTest complete.')
}

testTriple().catch(err => {
	console.error('Test failed:', err)
	process.exit(1)
})

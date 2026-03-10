import pc from 'picocolors'

import article from '../datasets/article_en_1.txt'
import { initEmbeddingModel, initEnv } from '../src/env'
import chunking from '../src/pipeline/chunking'

await initEnv()
await initEmbeddingModel()

const res = await chunking(article)

res.map(item => {
	console.log(pc.green('[***************************]'))
	console.log(item)
})

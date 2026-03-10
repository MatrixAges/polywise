// import article from '../datasets/article_cn_1.txt'
import article from '../datasets/article_cn_2.md?raw'
import { initModels } from '../src/env'
import chunking from '../src/pipeline/chunking'

await initModels()

const res = await chunking(article)

res.map(item => {
	console.log('--------')
	console.log(item)
})

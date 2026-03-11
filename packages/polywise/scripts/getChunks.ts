import { writeFileSync } from 'fs-extra'
import pc from 'picocolors'

import article from '../datasets/article_en_1.txt'
import { initEmbeddingModel, initEnv } from '../src/env'
import { getChunks } from '../src/pipeline'

await initEnv()
await initEmbeddingModel()

const chunks = await getChunks(article)

chunks.map(item => {
	console.log(pc.green('[***************************]'))
	console.log(item)
})

writeFileSync(`${process.cwd()}/datasets/__temp__.txt`, chunks.join('\n\n__CHUNK_BOUNDARY__\n\n'))

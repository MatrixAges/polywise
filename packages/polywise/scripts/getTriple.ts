import { getLlama, LlamaChatSession } from 'node-llama-cpp'

import text from '../datasets/triple_cn_1'
import { app, prompt } from '../src/consts'
import { loadModel } from '../src/utils'

const llama = await getLlama()

const model = await loadModel({
	llama,
	model_uri: app.triple_model.uri,
	dir_path: app.model_dir,
	file_name: app.triple_model.file_name
})

const context = await model.createContext({ threads: 8 })

const session = new LlamaChatSession({
	contextSequence: context.getSequence(),
	systemPrompt: prompt.get_triple
})

const grammar = await llama.createGrammarForJsonSchema({
	type: 'array',
	items: {
		type: 'object',
		properties: {
			head: { type: 'string', description: '头实体（主语）' },
			relation: { type: 'string', description: '关系（谓语）' },
			tail: { type: 'string', description: '尾实体（宾语）' }
		},
		required: ['head', 'relation', 'tail'],
		additionalProperties: false
	}
})

console.log('正在提取三元组...')

const before = performance.now()

const res = await session.prompt(text, {
	grammar,
	onTextChunk: chunk => {
		process.stdout.write(chunk)
	}
})

const after = performance.now()

const duration = ((after - before) / 1000).toFixed(2)

console.log(`\n总耗时: ${duration} 秒`)

// console.log(JSON.stringify(JSON.parse(res), null, 2))

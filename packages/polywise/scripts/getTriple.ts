import { getLlama, LlamaChatSession } from 'node-llama-cpp'

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

const text =
	'史蒂夫·乔布斯（Steve Jobs）、史蒂夫·沃兹尼亚克（Steve Wozniak）和罗纳德·韦恩（Ronald Wayne）于1976年4月1日共同创立了苹果公司（Apple Inc.），其最初的目的是为了开发和销售沃兹尼亚克设计并制造的Apple I个人电脑。1977年1月，苹果公司正式注册成立，并随着Apple II的发布而迅速崛起，这款电脑成为了1970年代末最成功的个人电脑之一。1980年，苹果公司公开上市，筹集了大量资金并造就了众多百万富翁。1984年，苹果推出了具有革命性图形用户界面的麦金塔（Macintosh）电脑，并在著名的“1984”超级碗广告中大放异彩。然而，由于内部权力斗争，乔布斯于1985年离开了苹果公司，转而创立了NeXT公司。直到1997年，苹果公司收购了NeXT，乔布斯才得以回归，并带领公司推出了iMac、iPod、iPhone和iPad等一系列创新产品，使苹果成为全球市值最高的科技公司之一。'

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

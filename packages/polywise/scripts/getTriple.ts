import text from '../datasets/triple_cn_1'
import { initEnv } from '../src/env'
import { initGenModel } from '../src/llama'
import { getTriples } from '../src/pipeline'

await initEnv()
await initGenModel()

await getTriples(text, chunk => process.stdout.write(chunk))

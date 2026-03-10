import text from '../datasets/triple_cn_1'
import { initModels } from '../src/env'
import { getTriples } from '../src/utils'

await initModels()

await getTriples(text, chunk => process.stdout.write(chunk))

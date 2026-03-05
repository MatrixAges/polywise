import { resolve } from 'path'
import { writeFileSync } from 'fs-extra'
import tsj from 'ts-json-schema-generator'

import type { Config } from 'ts-json-schema-generator'

const cwd = process.cwd()
const input_path = resolve(`${cwd}/setting/provider/ai-sdk-panel/types.ts`)
const output_path = resolve(`${cwd}/setting/provider/ai-sdk-panel/schema.json`)

const config = { path: input_path, type: 'Config', skipTypeCheck: true, schemaId: 'https://_.json' } as Config

const schema = tsj.createGenerator(config).createSchema(config.type)

const json = JSON.stringify(schema, null, 4)

writeFileSync(output_path, json)

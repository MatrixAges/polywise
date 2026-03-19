import { EventEmitter } from 'events'
import { boolean, object } from 'zod'

import type z from 'zod'

export const config_schema = object({
	enable_triple: boolean().optional()
}).loose()

export type Config = z.infer<typeof config_schema>

export const config: Config = {}
export const config_emitter = new EventEmitter()

export { default as saveConfig } from './saveConfig'

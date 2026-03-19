import { EventEmitter } from 'events'

export interface Config {
	enable_triple?: boolean
	[key: string]: unknown
}

export const config: Config = {}
export const config_emitter = new EventEmitter()

export { default as saveConfig } from './saveConfig'

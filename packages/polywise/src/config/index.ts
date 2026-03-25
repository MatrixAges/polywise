import { EventEmitter } from 'events'

import type { AppConfig } from '@core/types'

export const config = {} as AppConfig
export const config_emitter = new EventEmitter()

export { default as saveConfig } from './saveConfig'
export { default as initConfig, config_watcher } from './initConfig'

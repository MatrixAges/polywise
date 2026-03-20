import { EventEmitter } from 'events'
import { task } from '@core/db/schema'

import type { queueAsPromised } from 'fastq'

export type Task = typeof task.$inferSelect

export interface Queue {
	map: Map<string, queueAsPromised<Task>>
	intervals: Map<string, NodeJS.Timeout | null>
	ticks: Map<string, number>
	on: boolean
}

export const queue = {} as Queue
export const emitter = new EventEmitter()

export { default as pauseQueue } from './pauseQueue'
export { default as resumeQueue } from './resumeQueue'
export { pauseTriple, resumeTriple } from './pauseTriple'
export { default as cancelTask } from './cancelTask'
export { default as ignoreTask } from './ignoreTask'
export { default as removeTask } from './removeTask'
export { default as retryTask } from './retryTask'
export { default as startQueue } from './start'

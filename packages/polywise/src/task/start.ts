import { log } from '@core/utils'
import fastq from 'fastq'

import { queue } from '.'
import poll from './poll'
import process from './process'

const concurrent: Record<string, number> = {
	url: 3,
	triple: 1
}

const handlers = ['triple']

export default () => {
	if (queue.on) return

	queue.map = new Map()
	queue.intervals = new Map()
	queue.ticks = new Map()
	queue.on = true

	for (const type of handlers) {
		const q = fastq.promise({} as any, process, concurrent[type] ?? 1)

		q.error((err, item) => {
			if (err) log('TASK_QUEUE', 'queueError', () => `${item.id}: ${err}`)
		})

		queue.map.set(type, q)
		queue.ticks.set(type, 300)

		poll(type)
	}

	log('TASK_QUEUE', 'start', () => `started ${queue.map.size} queues`)
}

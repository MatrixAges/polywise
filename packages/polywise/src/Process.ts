import { createHash } from 'crypto'

import { getRandomId } from './utils'

export interface ProcessEvent {
	key: string
	value: any
}

export type ProcessCallback = (event: ProcessEvent, total: Record<string, any>) => void

export default class Process {
	private callbacks: Set<ProcessCallback> = new Set()
	public total: Record<string, any> = {}
	public hash: string
	public query: string

	constructor(query: string) {
		this.query = query
		this.hash = this.generateHash(query)
	}

	private generateHash(str: string): string {
		const hash = createHash('sha256').update(str).digest('hex')
		return `${hash}-${getRandomId()}`
	}

	on(callback: ProcessCallback): Process {
		this.callbacks.add(callback)
		return this
	}

	emit(key: string, value: any) {
		this.total[key] = value
		const event = { key, value }
		for (const callback of this.callbacks) {
			try {
				callback(event, this.total)
			} catch (error) {
				console.error('Process callback error:', error)
			}
		}
	}

	off() {
		this.callbacks.clear()
		this.total = {}
	}
}

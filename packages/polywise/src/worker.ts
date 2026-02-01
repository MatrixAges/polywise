import { Polywise } from './Polywise'

const poly = new Polywise(undefined, 'engine')

export type WorkerTask =
	| { task: 'initDB'; args: [dataDir?: string] }
	| { task: 'exec'; args: [sql: string] }
	| { task: 'query'; args: [sql: string, params?: any[]] }
	| { task: 'tick'; args: [threshold: number] }

export type WorkerResult<T = any> = { status: 'ok'; data?: T } | { status: 'error'; message: string }

const handlers: Record<string, (...args: any[]) => Promise<any>> = {
	initDB: poly.initDB.bind(poly),
	exec: poly.exec.bind(poly),
	query: poly.query.bind(poly),
	tick: poly.tick.bind(poly)
}

export default async function ({ task, args }: WorkerTask): Promise<WorkerResult> {
	try {
		const handler = handlers[task]
		if (!handler) throw new Error(`Unknown task: ${task}`)
		const data = await handler(...args)
		return { status: 'ok', data }
	} catch (e: any) {
		return { status: 'error', message: String(e) }
	}
}

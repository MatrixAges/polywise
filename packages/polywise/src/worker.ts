import { PolywiseEngine } from './engine'

const engine = new PolywiseEngine()

export type WorkerTask =
	| { task: 'initDB'; args: [dataDir?: string] }
	| { task: 'exec'; args: [sql: string] }
	| { task: 'query'; args: [sql: string, params?: any[]] }
	| { task: 'tick'; args: [threshold: number] }

export type WorkerResult<T = any> = { status: 'ok'; data?: T } | { status: 'error'; message: string }

const handlers: Record<string, (...args: any[]) => Promise<any>> = {
	initDB: engine.initDB.bind(engine),
	exec: engine.exec.bind(engine),
	query: engine.query.bind(engine),
	tick: engine.tick.bind(engine)
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

import to from 'await-to-js'
import mingo from 'mingo'
import { injectable } from 'tsyringe'

import Fs from './Fs'

import type { SessionState } from './types'

@injectable()
export default class Sessions {
	private current_state: SessionState = {
		context: {},
		history: [],
		undo_stack: [],
		redo_stack: []
	}

	constructor(private fs: Fs) {}

	public async init(conversation_id: string, session_id: string) {
		const [err, saved] = await to(this.fs.loadSession(conversation_id, session_id))

		if (!err && saved) {
			this.current_state = saved as SessionState
		}
	}

	public queryContext(query: Record<string, unknown>) {
		const cursor = mingo.find([this.current_state.context], query)

		return cursor.all()
	}

	public updateContext(update: Record<string, unknown>) {
		this.pushUndo()

		this.current_state.context = { ...this.current_state.context, ...update }
		this.current_state.redo_stack = []
	}

	public undo() {
		if (this.current_state.undo_stack.length === 0) {
			return
		}

		this.current_state.redo_stack.push(JSON.parse(JSON.stringify(this.current_state.context)))
		this.current_state.context = this.current_state.undo_stack.pop()!
	}

	public redo() {
		if (this.current_state.redo_stack.length === 0) {
			return
		}

		this.current_state.undo_stack.push(JSON.parse(JSON.stringify(this.current_state.context)))
		this.current_state.context = this.current_state.redo_stack.pop()!
	}

	public addHistory(message: unknown) {
		this.current_state.history.push(message)
	}

	public async save(conversation_id: string, session_id: string) {
		await to(this.fs.saveSession(conversation_id, session_id, this.current_state))
	}

	public getContext() {
		return this.current_state.context
	}

	public getHistory() {
		return this.current_state.history
	}

	private pushUndo() {
		this.current_state.undo_stack.push(JSON.parse(JSON.stringify(this.current_state.context)))

		if (this.current_state.undo_stack.length > 50) {
			this.current_state.undo_stack.shift()
		}
	}
}

import { injectable } from 'tsyringe'

import Fs from './Fs'
import { ShadowContextSchema } from './types/shadow'

import type { ModelMessage } from 'ai'
import type { ShadowContext } from './types/shadow'

@injectable()
export default class Session {
	private current_shadow_context: ShadowContext = {
		refs: [],
		context: '',
		tasks: [],
		current_task: ''
	}

	private conversation_id: string | null = null

	constructor(private fs: Fs) {}

	public async init(conversation_id: string) {
		this.conversation_id = conversation_id
		const saved = await this.fs.loadShadowContext(conversation_id)

		if (saved) {
			this.current_shadow_context = saved
		}
	}

	public getShadowContext(): ShadowContext {
		return this.current_shadow_context
	}

	public async getLastMessages(count: number): Promise<Array<ModelMessage>> {
		if (!this.conversation_id) return []
		return await this.fs.getLastMessages(this.conversation_id, count)
	}

	public async updateShadowContext(update: Partial<ShadowContext>) {
		if (!this.conversation_id) return

		this.current_shadow_context = { ...this.current_shadow_context, ...update }

		const validation = ShadowContextSchema.safeParse(this.current_shadow_context)
		if (validation.success) {
			this.current_shadow_context = validation.data
		}

		await this.fs.saveShadowContext(this.conversation_id, this.current_shadow_context)
	}

	public async addMessage(message: { id: string; role: string; content: string }) {
		if (!this.conversation_id) return
		await this.fs.saveMessage(this.conversation_id, message.id, message.role, message.content)
		await this.fs.appendToList(this.conversation_id, message)
	}
}

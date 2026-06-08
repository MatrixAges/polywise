import events from 'events'

export interface PipelineRefreshPayload {
	updated_at: number
	article_id?: string | null
}

export const pipeline_emitter = new events.EventEmitter()

export const emitPipelineRefresh = (args: { article_id?: string | null } = {}) => {
	pipeline_emitter.emit('change', {
		updated_at: Date.now(),
		article_id: args.article_id ?? null
	} satisfies PipelineRefreshPayload)
}

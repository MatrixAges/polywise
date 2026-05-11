import events from 'events'

export interface PipelineRefreshPayload {
	updated_at: number
}

export const pipeline_emitter = new events.EventEmitter()

export const emitPipelineRefresh = () => {
	pipeline_emitter.emit('change', { updated_at: Date.now() } satisfies PipelineRefreshPayload)
}

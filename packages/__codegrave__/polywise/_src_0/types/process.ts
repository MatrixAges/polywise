export interface ProcessEvent {
	key: string
	value: any
}

export type ProcessCallback = (event: ProcessEvent, total: Record<string, any>) => void

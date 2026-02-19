export interface MemoryItem {
	memory_id: string
	text: string
	score: number
	metadata: Record<string, any> | null
	updated_at: string
}

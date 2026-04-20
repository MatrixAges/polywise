export interface SessionGroupItem {
	name: string
	created_at: number
	updated_at: number
	items: Array<string>
}

export interface SessionPinItem {
	id: string
	pin_at: number
}

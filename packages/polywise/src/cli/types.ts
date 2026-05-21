export interface HelpNode {
	id: string
	title: string
	summary: string
	kind: 'root' | 'group' | 'command' | 'page' | 'section'
	children?: Array<string>
	hints?: Array<string>
	examples?: Array<string>
}

export interface RenderedHelp {
	path: Array<string>
	title: string
	summary: string
	items: Array<{
		key: string
		title: string
		summary: string
		kind: HelpNode['kind']
	}>
	hints: Array<string>
	examples: Array<string>
}

export interface ApiMapItem {
	id: string
	rpc_path: string
	method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
	openapi_path: string
	cli_path: Array<string>
	group_path: Array<string>
	summary: string
	description?: string
	input_hint: Array<string>
	examples: Array<string>
	parameters: Array<{
		name: string
		in: 'path' | 'query' | 'body'
		required: boolean
		type: string
		description?: string
	}>
}

export interface PageMapItem {
	id: string
	kind: 'route' | 'panel'
	title: string
	summary: string
	parent_id?: string
	route_path?: string
	panel_tab?: string
	params_hint: Array<string>
	children?: Array<string>
}

export interface PageVisibleSection {
	id: string
	title: string
	kind: 'heading' | 'list' | 'form' | 'editor' | 'chat' | 'detail'
	summary: string
	text_excerpt?: string
}

export interface PageActionItem {
	id: string
	label: string
	kind: 'navigate' | 'click' | 'input'
}

export interface PageRuntimeSnapshot {
	route: {
		pathname: string
		search: Record<string, string>
		params: Record<string, string>
	}
	panel: {
		active_tab: string | null
		page_id: string | null
	}
	page_id: string | null
	route_page_id: string | null
	page_title: string
	page_summary: string
	visible_sections: Array<PageVisibleSection>
	actions: Array<PageActionItem>
	updated_at: number
}

export interface PageRuntimeCommand {
	seq: number
	type: 'navigate' | 'panel' | 'back'
	target?: string
	params?: Record<string, string>
	created_at: number
}

export interface PageBridgeSyncInput {
	snapshot: PageRuntimeSnapshot | null
	last_ack_seq: number
}

export interface PageBridgeSyncOutput {
	server_time: number
	pending_commands: Array<PageRuntimeCommand>
}

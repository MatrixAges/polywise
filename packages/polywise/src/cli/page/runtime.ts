import type { PageBridgeSyncInput, PageBridgeSyncOutput, PageRuntimeCommand, PageRuntimeSnapshot } from '../types'

interface PageRuntimeState {
	snapshot: PageRuntimeSnapshot | null
	last_sync_at: number | null
	next_seq: number
	ack_seq: number
	commands: Array<PageRuntimeCommand>
}

const state: PageRuntimeState = {
	snapshot: null,
	last_sync_at: null,
	next_seq: 1,
	ack_seq: 0,
	commands: []
}

export const getPageRuntimeSnapshot = () => state.snapshot

export const getPageRuntimeStatus = () => ({
	snapshot: state.snapshot,
	last_sync_at: state.last_sync_at,
	last_sync_age_ms: state.last_sync_at ? Date.now() - state.last_sync_at : null,
	bridge_online: state.last_sync_at ? Date.now() - state.last_sync_at < 5000 : false,
	ack_seq: state.ack_seq,
	pending_count: state.commands.filter(item => item.seq > state.ack_seq).length
})

export const syncPageRuntime = (input: PageBridgeSyncInput): PageBridgeSyncOutput => {
	if (input.snapshot) {
		state.snapshot = input.snapshot
	}

	state.last_sync_at = Date.now()
	state.ack_seq = Math.max(state.ack_seq, input.last_ack_seq)
	state.commands = state.commands.filter(item => item.seq > state.ack_seq - 8)

	return {
		server_time: Date.now(),
		pending_commands: state.commands.filter(item => item.seq > state.ack_seq)
	}
}

export const enqueuePageRuntimeCommand = (
	command: Omit<PageRuntimeCommand, 'seq' | 'created_at'>
): PageRuntimeCommand => {
	const next_command: PageRuntimeCommand = {
		...command,
		seq: state.next_seq++,
		created_at: Date.now()
	}

	state.commands.push(next_command)

	return next_command
}

export const waitForPageRuntimeAck = async (seq: number, timeout_ms = 4000) => {
	const start = Date.now()

	while (Date.now() - start < timeout_ms) {
		if (state.ack_seq >= seq) {
			return true
		}

		await new Promise(resolve => setTimeout(resolve, 120))
	}

	return false
}

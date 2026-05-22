import { useEffect, useRef } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router'

import { server_sys_url } from '@/appdata'

import { collectPageSnapshot } from './pageSnapshot'

import type { PageBridgeSyncOutput, PageRuntimeCommand } from '@core/cli/types'

const command_attempt_cooldown_ms = 1200

const readSearchParams = (search: string) => {
	const entries = {} as Record<string, string>

	for (const [key, value] of new URLSearchParams(search).entries()) {
		entries[key] = value
	}

	return entries
}

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

const matchesCommandSnapshot = (command: PageRuntimeCommand, snapshot: ReturnType<typeof collectPageSnapshot>) => {
	if (command.expected_panel_page_id) {
		return snapshot.panel.page_id === command.expected_panel_page_id
	}

	if (command.expected_route_page_id) {
		return snapshot.route_page_id === command.expected_route_page_id
	}

	if (command.expected_route_pathname) {
		return snapshot.route.pathname === command.expected_route_pathname
	}

	return false
}

const clickPanelTab = async (tab: string) => {
	const target = document.querySelector(`[data-page-tabs="panel"] [data-tab-key="${tab}"]`) as HTMLElement | null

	if (!target) {
		return false
	}

	target.click()
	await wait(80)

	return true
}

const executeCommand = async (command: PageRuntimeCommand, navigate: ReturnType<typeof useNavigate>) => {
	if (command.type === 'back') {
		navigate(-1)
		await wait(80)
		return true
	}

	if (command.type === 'panel' && command.target) {
		return clickPanelTab(command.target)
	}

	if (command.type === 'navigate' && command.target) {
		navigate(command.target)
		await wait(80)
		return true
	}

	return false
}

const syncBridge = async (args: {
	snapshot: ReturnType<typeof collectPageSnapshot> | null
	last_ack_seq: number
	getSnapshot: () => ReturnType<typeof collectPageSnapshot>
	navigate: ReturnType<typeof useNavigate>
	command_attempts: Map<number, number>
}) => {
	const res = await fetch(`${server_sys_url}/page/bridge`, {
		method: 'POST',
		headers: {
			'content-type': 'application/json'
		},
		body: JSON.stringify({
			snapshot: args.snapshot,
			last_ack_seq: args.last_ack_seq
		})
	})

	if (!res.ok) {
		return args.last_ack_seq
	}

	const data = (await res.json()) as PageBridgeSyncOutput
	let ack_seq = args.last_ack_seq

	for (const command of data.pending_commands) {
		if (matchesCommandSnapshot(command, args.getSnapshot())) {
			ack_seq = Math.max(ack_seq, command.seq)
			args.command_attempts.delete(command.seq)
			continue
		}

		const last_attempt_at = args.command_attempts.get(command.seq) || 0

		if (Date.now() - last_attempt_at < command_attempt_cooldown_ms) {
			break
		}

		const handled = await executeCommand(command, args.navigate)
		args.command_attempts.set(command.seq, Date.now())

		if (!handled) {
			break
		}

		const current_snapshot = args.getSnapshot()

		if (matchesCommandSnapshot(command, current_snapshot)) {
			ack_seq = Math.max(ack_seq, command.seq)
			args.command_attempts.delete(command.seq)
			continue
		}

		break
	}

	return ack_seq
}

const Index = () => {
	const navigate = useNavigate()
	const { pathname, search, key: location_key } = useLocation()
	const params = useParams()
	const params_key = JSON.stringify(params)
	const last_ack_seq = useRef(0)
	const last_state_signature = useRef('')
	const command_attempts = useRef(new Map<number, number>())
	const inflight = useRef(false)

	useEffect(() => {
		let disposed = false

		const getSnapshot = () =>
			collectPageSnapshot({
				pathname,
				search: readSearchParams(search),
				params: Object.fromEntries(
					Object.entries(params)
						.filter(([, value]) => typeof value === 'string' && value.length)
						.map(([key, value]) => [key, value as string])
				)
			})

		const getStateSignature = (snapshot: ReturnType<typeof collectPageSnapshot>) =>
			JSON.stringify({
				location_key,
				pathname: snapshot.route.pathname,
				search: snapshot.route.search,
				params: snapshot.route.params,
				route_page_id: snapshot.route_page_id,
				panel_page_id: snapshot.panel.page_id,
				panel_tab: snapshot.panel.active_tab
			})

		const syncSnapshot = async () => {
			if (disposed || inflight.current) {
				return
			}

			const snapshot = getSnapshot()
			const state_signature = getStateSignature(snapshot)

			if (state_signature === last_state_signature.current) {
				return
			}

			inflight.current = true
			let synced = false

			try {
				last_ack_seq.current = await syncBridge({
					snapshot,
					last_ack_seq: last_ack_seq.current,
					getSnapshot,
					navigate,
					command_attempts: command_attempts.current
				})
				synced = true
			} catch {
				// Ignore transient bridge failures and let the next route-state sync retry.
			} finally {
				inflight.current = false
			}

			if (synced) {
				last_state_signature.current = getStateSignature(getSnapshot())
			}
		}

		void syncSnapshot()

		const observer = new MutationObserver(() => {
			void syncSnapshot()
		})

		observer.observe(document.body, {
			subtree: true,
			attributes: true,
			attributeFilter: ['data-active']
		})

		return () => {
			disposed = true
			observer.disconnect()
		}
	}, [pathname, search, location_key, navigate, params_key])

	return null
}

export default Index

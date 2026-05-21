import { useEffect, useRef } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router'

import { server_sys_url } from '@/appdata'

import { collectPageSnapshot } from './pageSnapshot'

import type { PageBridgeSyncOutput, PageRuntimeCommand } from '@core/cli/types'

const poll_interval_ms = 1200

const readSearchParams = (search: string) => {
	const entries = {} as Record<string, string>

	for (const [key, value] of new URLSearchParams(search).entries()) {
		entries[key] = value
	}

	return entries
}

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

const clickPanelTab = async (tab: string) => {
	const target = document.querySelector(`[data-page-tabs="panel"] [data-tab-key="${tab}"]`) as HTMLElement | null

	target?.click()
	await wait(80)
}

const executeCommand = async (command: PageRuntimeCommand, navigate: ReturnType<typeof useNavigate>) => {
	if (command.type === 'back') {
		navigate(-1)
		await wait(80)
		return
	}

	if (command.type === 'panel' && command.target) {
		await clickPanelTab(command.target)
		return
	}

	if (command.type === 'navigate' && command.target) {
		navigate(command.target)
		await wait(80)
	}
}

const syncBridge = async (args: {
	last_ack_seq: number
	pathname: string
	search: string
	params: Record<string, string | undefined>
	navigate: ReturnType<typeof useNavigate>
}) => {
	const snapshot = collectPageSnapshot({
		pathname: args.pathname,
		search: readSearchParams(args.search),
		params: Object.fromEntries(
			Object.entries(args.params)
				.filter(([, value]) => typeof value === 'string' && value.length)
				.map(([key, value]) => [key, value as string])
		)
	})
	const res = await fetch(`${server_sys_url}/page/bridge`, {
		method: 'POST',
		headers: {
			'content-type': 'application/json'
		},
		body: JSON.stringify({
			snapshot,
			last_ack_seq: args.last_ack_seq
		})
	})

	if (!res.ok) {
		return args.last_ack_seq
	}

	const data = (await res.json()) as PageBridgeSyncOutput
	let ack_seq = args.last_ack_seq

	for (const command of data.pending_commands) {
		await executeCommand(command, args.navigate)
		ack_seq = Math.max(ack_seq, command.seq)
	}

	return ack_seq
}

const Index = () => {
	const navigate = useNavigate()
	const { pathname, search } = useLocation()
	const params = useParams()
	const params_key = JSON.stringify(params)
	const last_ack_seq = useRef(0)
	const inflight = useRef(false)

	useEffect(() => {
		let disposed = false
		let debounce_timer = 0 as number | null

		const run = async () => {
			if (disposed || inflight.current) {
				return
			}

			inflight.current = true

			try {
				last_ack_seq.current = await syncBridge({
					last_ack_seq: last_ack_seq.current,
					pathname,
					search,
					params,
					navigate
				})
			} finally {
				inflight.current = false
			}
		}

		const scheduleRun = () => {
			if (disposed || debounce_timer) {
				return
			}

			debounce_timer = window.setTimeout(() => {
				debounce_timer = null
				void run()
			}, 140)
		}

		void run()

		const timer = window.setInterval(() => void run(), poll_interval_ms)
		const observer = new MutationObserver(() => scheduleRun())

		observer.observe(document.body, {
			childList: true,
			subtree: true,
			attributes: true,
			attributeFilter: ['data-active', 'data-page-section']
		})

		return () => {
			disposed = true
			if (debounce_timer) {
				window.clearTimeout(debounce_timer)
			}
			window.clearInterval(timer)
			observer.disconnect()
		}
	}, [pathname, search, navigate, params_key])

	return null
}

export default Index

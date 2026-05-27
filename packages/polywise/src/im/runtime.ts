import { im_account } from '@core/db/schema'
import { getImAccounts, setImAccount } from '@core/db/services'
import { env } from '@core/env'
import { and, asc, eq } from 'drizzle-orm'

import DiscordAdapter from './adapters/discord'
import FeishuAdapter from './adapters/feishu'
import WechatAdapter from './adapters/wechat'
import { buildImUserMessage, parseImCommand, shouldReplyInDirectMessage } from './message'
import { buildImRouteKey, getAdapterKey } from './route'
import { ensureImSessionBinding, resetImSessionBinding } from './session'
import { deliverImSessionStream } from './stream'

import type { ImAccount } from '@core/db'
import type { ImAdapter, ImInboundEvent, ImRouteState, ImRuntime } from './types'

const buildAdapter = (account: ImAccount, emit_inbound: (event: ImInboundEvent) => Promise<void>) => {
	if (account.platform === 'discord') {
		const adapter = new DiscordAdapter(account)
		adapter.setInboundHandler(emit_inbound)
		return adapter
	}

	if (account.platform === 'wechat') {
		const adapter = new WechatAdapter(account)
		adapter.setInboundHandler(emit_inbound)
		return adapter
	}

	if (account.platform === 'feishu') {
		const adapter = new FeishuAdapter(account)
		adapter.setInboundHandler(emit_inbound)
		return adapter
	}

	return null
}

export const createImRuntime = (): ImRuntime => {
	const adapters = new Map<string, ImAdapter>()
	const routes = new Map<string, ImRouteState>()
	let start_promise: Promise<void> | null = null

	const getAdapter = (platform: ImInboundEvent['platform'], account_id: string) =>
		adapters.get(getAdapterKey(platform, account_id)) || null

	const setAccountStatus = async (
		platform: string,
		account_id: string,
		status: string,
		last_error?: string | null
	) => {
		await setImAccount(and(eq(im_account.platform, platform), eq(im_account.account_id, account_id))!, {
			status,
			last_error: last_error ?? null
		}).catch(() => null)
	}

	const processControlCommand = async (event: ImInboundEvent) => {
		const command = parseImCommand(event.message.text)

		if (!command) return false

		const binding = await ensureImSessionBinding(event)
		const adapter = getAdapter(event.platform, event.account_id)

		if (!adapter) {
			throw new Error(`Adapter missing for ${event.platform}:${event.account_id}`)
		}

		if (command === 'stop') {
			await binding.session.abortStream().catch(() => null)
			await adapter.sendMessage({ route: event.route, text: 'Stopped current run.' })
			return true
		}

		await binding.session.abortStream().catch(() => null)
		await resetImSessionBinding(event)
		await adapter.sendMessage({ route: event.route, text: 'Session reset.' })

		return true
	}

	const processRouteEvent = async (state: ImRouteState, event: ImInboundEvent) => {
		const adapter = getAdapter(event.platform, event.account_id)

		if (!adapter) {
			throw new Error(`Adapter missing for ${event.platform}:${event.account_id}`)
		}

		if (await processControlCommand(event)) {
			state.last_active_at = Date.now()
			return
		}

		const binding = await ensureImSessionBinding(event)
		const reply_route =
			shouldReplyInDirectMessage(event) && adapter.resolveDirectRoute
				? (await adapter
						.resolveDirectRoute({
							sender_id: event.sender.id,
							sender_name: event.sender.name,
							current_route: event.route
						})
						.catch(() => null)) || event.route
				: event.route
		const request_message = buildImUserMessage(event, { reply_route })
		const stream = await binding.session.getStream(request_message)
		const baseline_message_count = binding.session.ui_messages.length
		const result = await deliverImSessionStream({
			adapter,
			route: reply_route,
			stream,
			session: binding.session,
			baseline_message_count
		})

		state.last_active_at = Date.now()

		return result
	}

	const drainRoute = async (state: ImRouteState) => {
		if (state.running) return

		state.running = true
		try {
			while (state.pending.length) {
				const event = state.pending.shift()!

				try {
					await processRouteEvent(state, event)
				} catch (error) {
					const adapter = getAdapter(event.platform, event.account_id)
					const message = error instanceof Error ? error.message : String(error)

					await setAccountStatus(event.platform, event.account_id, 'error', message)
					await adapter
						?.sendMessage({
							route: event.route,
							text: `IM runtime error: ${message}`
						})
						.catch(() => null)
				}
			}
		} finally {
			state.running = false
		}
	}

	const scheduleRouteDrain = (state: ImRouteState) => {
		if (state.drain_promise) return state.drain_promise

		state.drain_promise = drainRoute(state).finally(() => {
			state.drain_promise = null

			if (state.pending.length) {
				void scheduleRouteDrain(state)
			}
		})

		return state.drain_promise
	}

	const handleInboundEvent = async (event: ImInboundEvent) => {
		const route_key = buildImRouteKey(event.route)
		let state = routes.get(route_key)

		if (!state) {
			state = {
				route_key,
				running: false,
				pending: [],
				last_active_at: Date.now(),
				drain_promise: null
			}
			routes.set(route_key, state)
		}

		state.pending.push(event)
		void scheduleRouteDrain(state)
	}

	const parseBridgeBody = (raw_body: string) => JSON.parse(raw_body) as Record<string, unknown>

	const resolveBridgeAdapter = (payload: Record<string, unknown>) => {
		const account_id = String(payload.account_id || '').trim()
		if (!account_id) return null

		return adapters.get(getAdapterKey('wechat', account_id)) || null
	}

	return {
		adapters,
		routes,
		async start() {
			if (start_promise) {
				return await start_promise
			}

			start_promise = (async () => {
				const accounts = await getImAccounts({
					where: eq(im_account.enabled, true),
					orderBy: asc(im_account.created_at)
				})

				for (const account of accounts) {
					const adapter = buildAdapter(account, handleInboundEvent)

					if (!adapter) continue

					adapters.set(getAdapterKey(adapter.platform, adapter.account_id), adapter)

					try {
						await adapter.connect()
						await setAccountStatus(adapter.platform, adapter.account_id, 'connected', null)
					} catch (error) {
						const message = error instanceof Error ? error.message : String(error)
						await setAccountStatus(account.platform, account.account_id, 'error', message)
					}
				}
			})()

			try {
				await start_promise
			} finally {
				start_promise = null
			}
		},
		async stop() {
			for (const adapter of adapters.values()) {
				await adapter.disconnect().catch(() => null)
			}
		},
		registerAdapter(adapter) {
			adapters.set(getAdapterKey(adapter.platform, adapter.account_id), adapter)
		},
		getAdapter,
		handleInboundEvent,
		async handleWechatBridgeEvent(raw_body: string, signature: string | undefined) {
			let payload: Record<string, unknown>

			try {
				payload = parseBridgeBody(raw_body)
			} catch {
				return { ok: false, error: 'Invalid JSON body' }
			}

			const adapter = resolveBridgeAdapter(payload)

			if (!adapter || !adapter.handleBridgeEvent || !adapter.verifyBridgePayload) {
				return { ok: false, error: 'WeChat adapter not found' }
			}

			const verified = await adapter.verifyBridgePayload(raw_body, signature)

			if (!verified) {
				return { ok: false, error: 'Invalid bridge signature' }
			}

			const event = await adapter.handleBridgeEvent(payload)

			if (!event) {
				return { ok: false, error: 'Invalid bridge event' }
			}

			await handleInboundEvent(event)

			return { ok: true }
		},
		async handleWechatBridgeStatus(raw_body: string, signature: string | undefined) {
			let payload: Record<string, unknown>

			try {
				payload = parseBridgeBody(raw_body)
			} catch {
				return { ok: false, error: 'Invalid JSON body' }
			}

			const adapter = resolveBridgeAdapter(payload)

			if (!adapter || !adapter.handleBridgeStatus || !adapter.verifyBridgePayload) {
				return { ok: false, error: 'WeChat adapter not found' }
			}

			const verified = await adapter.verifyBridgePayload(raw_body, signature)

			if (!verified) {
				return { ok: false, error: 'Invalid bridge signature' }
			}

			await adapter.handleBridgeStatus(payload)

			return { ok: true }
		},
		async handleFeishuWebhookEvent(raw_body: string) {
			const candidates = Array.from(adapters.values()).filter(
				adapter => adapter.platform === 'feishu' && adapter.handleWebhookRequest
			)

			if (!candidates.length) {
				return { ok: false, error: 'Feishu adapter not found' }
			}

			let last_error = ''

			for (const adapter of candidates) {
				const result = await adapter.handleWebhookRequest!(raw_body)

				if (result.error) {
					last_error = result.error
				}

				if (!result.matched) {
					continue
				}

				if (result.challenge) {
					return {
						ok: true,
						challenge: result.challenge
					}
				}

				if (result.event) {
					await handleInboundEvent(result.event)
				}

				return { ok: true }
			}

			return {
				ok: false,
				error: last_error || 'Feishu webhook did not match any configured account'
			}
		},
		getHealth() {
			return {
				adapters: Array.from(adapters.values()).map(adapter => ({
					platform: adapter.platform,
					account_id: adapter.account_id
				})),
				routes: Array.from(routes.values()).map(state => ({
					route_key: state.route_key,
					running: state.running,
					pending: state.pending.length,
					last_active_at: state.last_active_at
				}))
			}
		}
	}
}

export const getImRuntime = () => env.im

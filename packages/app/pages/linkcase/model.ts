import { global_linkcase_session_id, global_linkcase_session_title } from '@core/consts'
import { makeAutoObservable } from 'mobx'
import { toast } from 'sonner'
import { injectable } from 'tsyringe'

import { server_sys_session_url } from '@/appdata'
import { Util } from '@/models/common'
import { alert, rpc } from '@/utils'

import type { Message } from '@core/fst'
import type { SessionStatusPayload } from '@core/rpc/session/watchSessionStatus'
import type { MouseEvent, UIEvent } from 'react'
import type {
	LinkcaseBatchIntervalUnit,
	LinkcaseDetail,
	LinkcaseFilterType,
	LinkcaseItem,
	LinkcaseSnifferBrowserId,
	LinkcaseSnifferBrowserStatus
} from './types'

@injectable()
export default class Index {
	items = [] as Array<LinkcaseItem>
	page = 1
	has_more = false
	loading = false
	loading_more = false
	selected_id = ''
	detail = null as LinkcaseDetail | null
	detail_loading = false
	menu_target_index = -1
	current_fetching_id = ''
	search_keyword = ''
	filter_type = 'title' as LinkcaseFilterType
	session_dialog_open = false
	start_dialog_open = false
	sniffer_dialog_open = false
	sniffer_statuses = [] as Array<LinkcaseSnifferBrowserStatus>
	sniffer_status_loading = false
	sniffer_importing_browser = '' as LinkcaseSnifferBrowserId | ''
	batch_count = 3
	batch_interval_value = 5
	batch_interval_unit = 'minute' as LinkcaseBatchIntervalUnit
	batch_scheduler_enabled = false
	batch_submit_loading = false
	batch_next_run_at = null as number | null
	batch_last_run_at = null as number | null
	batch_last_error = ''
	batch_runs = 0
	linkcase_session_running = false
	linkcase_session_unread = false
	linkcase_session_title = global_linkcase_session_title
	list_request_key = ''
	detail_request_key = ''
	search_timer = 0 as ReturnType<typeof setTimeout> | 0
	batch_timer = 0 as ReturnType<typeof setTimeout> | 0

	constructor(public util: Util) {
		makeAutoObservable(
			this,
			{
				util: false,
				list_request_key: false,
				detail_request_key: false,
				search_timer: false,
				batch_timer: false
			},
			{ autoBind: true }
		)
	}

	get global_session_id() {
		return global_linkcase_session_id
	}

	get selected_item() {
		return this.items.find(item => item.id === this.selected_id) ?? null
	}

	get menu_target_item() {
		return this.items[this.menu_target_index] ?? null
	}

	get batch_interval_ms() {
		const multiplier = this.batch_interval_unit === 'minute' ? 60_000 : 1_000

		return Math.max(this.batch_interval_value, 1) * multiplier
	}

	get batch_status_text() {
		if (this.linkcase_session_running) {
			return 'Batch fetch session is running'
		}

		if (this.batch_submit_loading) {
			return 'Submitting scheduled batch fetch'
		}

		if (this.batch_last_error) {
			return `Batch fetch warning: ${this.batch_last_error}`
		}

		if (this.batch_scheduler_enabled && this.batch_next_run_at) {
			const seconds = Math.max(Math.ceil((this.batch_next_run_at - Date.now()) / 1000), 0)

			return `Scheduled batch fetch: ${this.batch_count} links every ${this.batch_interval_value} ${this.batch_interval_unit}${this.batch_interval_value > 1 ? 's' : ''}, next in ${seconds}s`
		}

		return 'Batch fetch idle'
	}

	async init() {
		this.watchSessionStatus()
		await this.reloadList()
	}

	setSessionDialogOpen(value: boolean) {
		this.session_dialog_open = value
	}

	setStartDialogOpen(value: boolean) {
		this.start_dialog_open = value
	}

	setSnifferDialogOpen(value: boolean) {
		this.sniffer_dialog_open = value
	}

	setSearchKeyword(value: string) {
		this.search_keyword = value

		if (this.search_timer) {
			clearTimeout(this.search_timer)
		}

		this.search_timer = setTimeout(() => {
			this.search_timer = 0
			void this.reloadList()
		}, 250)
	}

	setFilterType(value: string) {
		this.filter_type = value as LinkcaseFilterType

		void this.reloadList()
	}

	setBatchCount(value: string) {
		this.batch_count = Math.min(Math.max(Number(value) || 1, 1), 10)
	}

	setBatchIntervalValue(value: string) {
		this.batch_interval_value = Math.max(Number(value) || 1, 1)
	}

	setBatchIntervalUnit(value: string) {
		this.batch_interval_unit = value as LinkcaseBatchIntervalUnit
	}

	getSnifferStatus(browser: LinkcaseSnifferBrowserId) {
		return this.sniffer_statuses.find(item => item.id === browser) ?? null
	}

	toListItem(item: LinkcaseItem | LinkcaseDetail): LinkcaseItem {
		return {
			id: item.id,
			url: item.url,
			title: item.title,
			favicon: item.favicon,
			status: item.status,
			generate_at: item.generate_at,
			created_at: item.created_at,
			updated_at: item.updated_at,
			article_count: item.article_count,
			article: item.article
				? {
						id: item.article.id,
						title: item.article.title,
						created_at: item.article.created_at,
						updated_at: item.article.updated_at,
						is_pipelined: item.article.is_pipelined,
						fetched_at: item.article.fetched_at
					}
				: null
		}
	}

	patchListItem(item: LinkcaseItem | LinkcaseDetail) {
		const next_item = this.toListItem(item)
		const current_index = this.items.findIndex(current => current.id === next_item.id)

		if (current_index === -1) {
			return
		}

		this.items[current_index] = next_item
	}

	async loadList(args?: { append?: boolean }) {
		const append = args?.append ?? false
		const target_page = append ? this.page + 1 : 1
		const request_key = `${target_page}:${this.search_keyword}:${this.filter_type}:${Date.now()}`

		if (append) {
			this.loading_more = true
		} else {
			this.loading = true
		}

		this.list_request_key = request_key

		try {
			const response = await rpc.linkcase.query.query({
				page: target_page,
				keyword: this.search_keyword.trim() || undefined,
				filter_type: this.filter_type
			})

			if (this.list_request_key !== request_key) {
				return
			}

			this.has_more = response.has_more
			this.page = target_page

			if (append) {
				const existing_ids = new Set(this.items.map(item => item.id))
				this.items.push(...response.items.filter(item => !existing_ids.has(item.id)))
			} else {
				this.items = response.items
			}

			if (this.items.length === 0) {
				this.selected_id = ''
				this.detail = null

				return
			}

			const next_selected_id = this.items.some(item => item.id === this.selected_id)
				? this.selected_id
				: this.items[0].id

			this.selected_id = next_selected_id

			if (!append) {
				void this.loadDetail(next_selected_id)
			}
		} finally {
			if (this.list_request_key === request_key) {
				this.loading = false
				this.loading_more = false
			}
		}
	}

	async reloadList() {
		this.page = 0
		await this.loadList()
	}

	async loadDetail(id = this.selected_id) {
		if (!id) {
			this.detail = null

			return
		}

		const request_key = `${id}:${Date.now()}`

		this.detail_loading = true
		this.detail_request_key = request_key

		try {
			const response = await rpc.linkcase.read.query({ id })

			if (this.detail_request_key !== request_key) {
				return
			}

			this.detail = response

			if (response) {
				this.patchListItem(response)
			}
		} finally {
			if (this.detail_request_key === request_key) {
				this.detail_loading = false
			}
		}
	}

	async selectLink(id: string) {
		this.selected_id = id
		await this.loadDetail(id)
	}

	async fetchSelectedLink() {
		if (!this.selected_id) {
			return
		}

		await this.fetchLink(this.selected_id)
	}

	async fetchLink(id: string) {
		if (this.current_fetching_id) {
			return
		}

		this.current_fetching_id = id

		try {
			await rpc.linkcase.fetch.mutate({ id })
			const response = await rpc.linkcase.read.query({ id })

			if (response) {
				this.patchListItem(response)

				if (this.selected_id === id) {
					this.detail = response
				}
			}

			await this.reloadList()
		} finally {
			this.current_fetching_id = ''
		}
	}

	async loadSnifferStatus() {
		this.sniffer_status_loading = true

		try {
			const response = await rpc.sniffer.status.query()

			this.sniffer_statuses = response.browsers
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Failed to inspect browser bookmarks')
		} finally {
			this.sniffer_status_loading = false
		}
	}

	openSnifferDialog() {
		this.sniffer_dialog_open = true

		void this.loadSnifferStatus()
	}

	async importBrowserBookmarks(browser: LinkcaseSnifferBrowserId) {
		if (this.sniffer_importing_browser) {
			return
		}

		this.sniffer_importing_browser = browser

		try {
			const result = await rpc.sniffer.importBookmarks.mutate({ browser })
			const summary = [
				`${result.name}: imported ${result.inserted_count} link(s).`,
				result.ignored_existing_count > 0
					? `Ignored ${result.ignored_existing_count} existing item(s).`
					: '',
				result.ignored_duplicate_count > 0
					? `Ignored ${result.ignored_duplicate_count} duplicate item(s).`
					: '',
				result.ignored_invalid_count > 0
					? `Ignored ${result.ignored_invalid_count} invalid item(s).`
					: ''
			]
				.filter(Boolean)
				.join(' ')

			if (!result.available) {
				toast.error(result.message)

				return
			}

			toast.success(summary || result.message)
			await this.reloadList()
			await this.loadSnifferStatus()
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Bookmark import failed')
		} finally {
			this.sniffer_importing_browser = ''
		}
	}

	async removeLink(id: string) {
		const target = this.items.find(item => item.id === id)
		const confirmed = await alert({
			title: 'Remove Link',
			desc: `Remove ${target?.title || target?.url || 'this link'} and its unattached fetched articles?`
		})

		if (!confirmed) {
			return
		}

		const current_index = this.items.findIndex(item => item.id === id)

		await rpc.linkcase.remove.mutate({ id })

		this.items = this.items.filter(item => item.id !== id)
		this.menu_target_index = -1

		if (this.selected_id === id) {
			const next_item = this.items[current_index] ?? this.items[current_index - 1] ?? null

			this.selected_id = next_item?.id ?? ''
			this.detail = null

			if (next_item) {
				void this.loadDetail(next_item.id)
			}
		}
	}

	onMenuScroll(event: UIEvent<HTMLDivElement>) {
		const element = event.currentTarget

		if (this.loading || this.loading_more || !this.has_more) {
			return
		}

		if (element.scrollTop + element.clientHeight < element.scrollHeight - 120) {
			return
		}

		void this.loadList({ append: true })
	}

	findMenuTarget(target: EventTarget | null) {
		let current_node = target instanceof HTMLElement ? target : null

		while (current_node) {
			const value = current_node.getAttribute('data-index')

			if (value !== null) {
				const index = Number(value)

				return Number.isNaN(index) ? -1 : index
			}

			current_node = current_node.parentElement
		}

		return -1
	}

	onMenuContextCapture(event: MouseEvent<HTMLDivElement>) {
		const next_index = this.findMenuTarget(event.target)

		if (next_index < 0) {
			this.menu_target_index = -1
			event.preventDefault()

			return
		}

		this.menu_target_index = next_index
	}

	clearBatchTimer() {
		if (this.batch_timer) {
			clearTimeout(this.batch_timer)
			this.batch_timer = 0
		}
	}

	queueNextBatchRun() {
		if (!this.batch_scheduler_enabled) {
			this.batch_next_run_at = null
			this.clearBatchTimer()

			return
		}

		this.clearBatchTimer()
		this.batch_next_run_at = Date.now() + this.batch_interval_ms
		this.batch_timer = setTimeout(() => {
			this.batch_timer = 0
			this.batch_next_run_at = null
			void this.runBatchCycle()
		}, this.batch_interval_ms)
	}

	buildBatchPrompt() {
		return [
			'Run one scheduled Linkcase batch fetch cycle.',
			`Use linkcase_tool action "fetch_next" to fetch up to ${this.batch_count} links.`,
			'Default priority should remain links with status none, fail, or timeout.',
			'If no candidates match, report that clearly.',
			'Return a concise summary with id, title, status, source, and any failures.'
		].join('\n')
	}

	consumeSessionResponse(response: Response) {
		if (!response.body) {
			return
		}

		const reader = response.body.getReader()

		const pump = async () => {
			try {
				while (true) {
					const { done } = await reader.read()

					if (done) {
						break
					}
				}
			} catch {}
		}

		void pump()
	}

	async submitBatchPrompt() {
		const message = {
			id: crypto.randomUUID(),
			role: 'user',
			parts: [{ type: 'text', text: this.buildBatchPrompt() }]
		} satisfies Message

		const response = await fetch(server_sys_session_url, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				id: this.global_session_id,
				message
			})
		})

		if (!response.ok) {
			throw new Error(`Batch session submit failed: ${response.status}`)
		}

		this.consumeSessionResponse(response)
	}

	async runBatchCycle() {
		if (!this.batch_scheduler_enabled) {
			return
		}

		if (this.batch_submit_loading || this.linkcase_session_running) {
			this.queueNextBatchRun()

			return
		}

		this.batch_submit_loading = true
		this.batch_last_error = ''
		this.batch_last_run_at = Date.now()

		try {
			await this.submitBatchPrompt()
			this.batch_runs += 1
		} catch (error) {
			this.batch_last_error = error instanceof Error ? error.message : String(error)
		} finally {
			this.batch_submit_loading = false
			this.queueNextBatchRun()
		}
	}

	startBatchSchedule() {
		this.batch_scheduler_enabled = true
		this.start_dialog_open = false
		this.batch_last_error = ''

		void this.runBatchCycle()
	}

	stopBatchSchedule() {
		this.batch_scheduler_enabled = false
		this.batch_next_run_at = null
		this.clearBatchTimer()
	}

	watchSessionStatus() {
		const deinit = rpc.session.watchSessionStatus.subscribe(undefined, {
			onData: response => {
				this.applySessionStatus(response)
			}
		})

		this.util.acts.push(deinit.unsubscribe)
	}

	applySessionStatus(response: SessionStatusPayload) {
		const status = response[this.global_session_id]

		if (!status) {
			return
		}

		const previous_running = this.linkcase_session_running

		this.linkcase_session_running = status.running
		this.linkcase_session_unread = status.unread
		this.linkcase_session_title = status.title || global_linkcase_session_title

		if (previous_running && !status.running) {
			void this.reloadList()
		}
	}

	deinit() {
		if (this.search_timer) {
			clearTimeout(this.search_timer)
			this.search_timer = 0
		}

		this.stopBatchSchedule()
		this.util.deinit()
	}
}

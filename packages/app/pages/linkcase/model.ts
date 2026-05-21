import { global_linkcase_session_id, global_linkcase_session_title } from '@core/consts'
import { makeAutoObservable } from 'mobx'
import { toast } from 'sonner'
import { setStorageWhenChange } from 'stk/mobx'
import { injectable } from 'tsyringe'

import { server_sys_session_url } from '@/appdata'
import { Util } from '@/models/common'
import { alert, rpc } from '@/utils'

import { getLinkcaseSnifferBrowserFolderKeys } from './types'

import type { Message } from '@core/fst'
import type { SessionStatusPayload } from '@core/rpc/session/watchSessionStatus'
import type { MouseEvent, UIEvent } from 'react'
import type {
	LinkcaseBatchAction,
	LinkcaseBatchIntervalUnit,
	LinkcaseBatchPanelTab,
	LinkcaseBatchRunResult,
	LinkcaseBatchTask,
	LinkcaseDetail,
	LinkcaseFilterType,
	LinkcaseItem,
	LinkcaseSnifferBrowserId,
	LinkcaseSnifferBrowserStatus
} from './types'

const linkcase_batch_config_storage_key = 'linkcase_batch_scheduler_config'
const parseStoredBoolean = (value: unknown) => value === true || value === 'true'
type LinkcaseBatchConfig = {
	batch_count: number
	batch_interval_value: number
	batch_interval_unit: LinkcaseBatchIntervalUnit
	batch_fetch_interval_value: number
	batch_fetch_interval_unit: LinkcaseBatchIntervalUnit
	batch_action_fetch_enabled: boolean
	batch_auto_remove_dead_links: boolean
	batch_extract_interval_value: number
	batch_extract_interval_unit: LinkcaseBatchIntervalUnit
	batch_action_extract_enabled: boolean
	batch_extract_concurrency: number
}

@injectable()
export default class Index {
	items = [] as Array<LinkcaseItem>
	page = 1
	has_more = false
	loading = false
	loading_more = false
	selected_id = ''
	select_mode = false
	checked_ids = [] as Array<string>
	detail = null as LinkcaseDetail | null
	detail_loading = false
	menu_target_index = -1
	current_ai_fetching_id = ''
	current_extracting_id = ''
	selection_fetch_submit_loading = false
	selection_remove_loading = false
	search_keyword = ''
	filter_type = 'title' as LinkcaseFilterType
	add_dialog_open = false
	add_dialog_mode = 'add' as 'add' | 'edit'
	editing_link_id = ''
	add_submit_loading = false
	add_title = ''
	add_url = ''
	add_content = ''
	session_dialog_open = false
	start_dialog_open = false
	sniffer_dialog_open = false
	sniffer_statuses = [] as Array<LinkcaseSnifferBrowserStatus>
	sniffer_status_loading = false
	sniffer_importing_browser = '' as LinkcaseSnifferBrowserId | ''
	sniffer_expanded_browser_ids = [] as Array<LinkcaseSnifferBrowserId>
	sniffer_selected_folder_keys = {} as Partial<Record<LinkcaseSnifferBrowserId, Array<string>>>
	batch_count = 3
	batch_action_fetch_enabled = true
	batch_auto_remove_dead_links = false
	batch_fetch_interval_value = 5
	batch_fetch_interval_unit = 'minute' as LinkcaseBatchIntervalUnit
	batch_action_extract_enabled = false
	batch_extract_interval_value = 5
	batch_extract_interval_unit = 'minute' as LinkcaseBatchIntervalUnit
	batch_extract_concurrency = 1
	batch_panel_tab = 'create' as LinkcaseBatchPanelTab
	batch_tasks = [] as Array<LinkcaseBatchTask>
	batch_submit_loading = false
	batch_running_action = '' as LinkcaseBatchAction | ''
	batch_last_run_at = null as number | null
	batch_last_error = ''
	batch_runs = 0
	linkcase_session_running = false
	linkcase_session_unread = false
	linkcase_session_title = global_linkcase_session_title
	list_request_key = ''
	detail_request_key = ''
	search_timer = 0 as ReturnType<typeof setTimeout> | 0
	batch_clock = Date.now()
	batch_clock_timer = 0 as ReturnType<typeof setInterval> | number | 0
	batch_task_refresh_timer = 0 as ReturnType<typeof setInterval> | number | 0

	constructor(public util: Util) {
		makeAutoObservable(
			this,
			{
				util: false,
				list_request_key: false,
				detail_request_key: false,
				search_timer: false,
				batch_clock_timer: false,
				batch_task_refresh_timer: false
			},
			{ autoBind: true }
		)
	}

	get global_session_id() {
		return global_linkcase_session_id
	}

	get selected_item() {
		if (this.detail && this.detail.id === this.selected_id) {
			return this.toListItem(this.detail)
		}

		return this.items.find(item => item.id === this.selected_id) ?? null
	}

	get checked_items() {
		const checked_id_set = new Set(this.checked_ids)

		return this.items.filter(item => checked_id_set.has(item.id))
	}

	get checked_count() {
		return this.checked_ids.length
	}

	get has_checked_items() {
		return this.select_mode && this.checked_count > 0
	}

	get menu_target_item() {
		return this.items[this.menu_target_index] ?? null
	}

	get all_loaded_checked() {
		if (this.items.length === 0) {
			return false
		}

		const checked_id_set = new Set(this.checked_ids)

		return this.items.every(item => checked_id_set.has(item.id))
	}

	get menu_action_ids() {
		const menu_target = this.menu_target_item

		if (this.has_checked_items && (!menu_target || this.checked_ids.includes(menu_target.id))) {
			return [...this.checked_ids]
		}

		return menu_target ? [menu_target.id] : [...this.checked_ids]
	}

	get menu_action_items() {
		const target_id_set = new Set(this.menu_action_ids)

		return this.items.filter(item => target_id_set.has(item.id))
	}

	get batch_status_text() {
		const active_task_count = this.batch_tasks.filter(task => task.enabled).length
		const paused_task_count = this.batch_tasks.length - active_task_count
		const next_task = this.batch_tasks
			.filter(task => task.enabled && task.next_run_at)
			.sort((a, b) => new Date(a.next_run_at ?? 0).getTime() - new Date(b.next_run_at ?? 0).getTime())[0]

		if (this.linkcase_session_running) {
			return 'Batch fetch session is running'
		}

		if (this.batch_submit_loading) {
			return `Running scheduled ${this.batch_running_action || 'task'}`
		}

		if (this.selection_fetch_submit_loading) {
			return 'Submitting selected links to batch session'
		}

		if (this.batch_last_error) {
			return `Batch warning: ${this.batch_last_error}`
		}

		if (next_task?.next_run_at) {
			return `${active_task_count} active task${active_task_count === 1 ? '' : 's'} · next in ${this.formatBatchRelativeTime(next_task.next_run_at)}`
		}

		if (paused_task_count > 0) {
			return `${paused_task_count} paused task${paused_task_count === 1 ? '' : 's'}`
		}

		return 'No scheduled tasks'
	}

	get batch_scheduler_enabled() {
		return this.batch_tasks.some(task => task.enabled)
	}

	get batch_task_count() {
		return this.batch_tasks.length
	}

	get sorted_batch_tasks() {
		return [...this.batch_tasks].sort((a, b) => {
			if (a.enabled !== b.enabled) {
				return a.enabled ? -1 : 1
			}

			if ((a.last_status === 'running') !== (b.last_status === 'running')) {
				return a.last_status === 'running' ? -1 : 1
			}

			return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
		})
	}

	async init() {
		this.migrateLegacyBatchConfig()
		const deinit = setStorageWhenChange(
			[
				{
					batch_count: {
						local_key: 'linkcase_batch_count',
						fromStorage: value => Math.min(Math.max(Number(value) || 1, 1), 10),
						toStorage: value => Math.min(Math.max(Number(value) || 1, 1), 10)
					}
				},
				{
					batch_fetch_interval_value: {
						local_key: 'linkcase_batch_fetch_interval_value',
						fromStorage: value => Math.max(Number(value) || 1, 1),
						toStorage: value => Math.max(Number(value) || 1, 1)
					}
				},
				{
					batch_fetch_interval_unit: {
						local_key: 'linkcase_batch_fetch_interval_unit',
						fromStorage: value => (value === 'second' || value === 'minute' ? value : 'minute'),
						toStorage: value => (value === 'second' || value === 'minute' ? value : 'minute')
					}
				},
				{
					batch_action_fetch_enabled: {
						local_key: 'linkcase_batch_action_fetch_enabled',
						fromStorage: parseStoredBoolean,
						toStorage: value => Boolean(value)
					}
				},
				{
					batch_auto_remove_dead_links: {
						local_key: 'linkcase_batch_auto_remove_dead_links',
						fromStorage: parseStoredBoolean,
						toStorage: value => Boolean(value)
					}
				},
				{
					batch_extract_interval_value: {
						local_key: 'linkcase_batch_extract_interval_value',
						fromStorage: value => Math.max(Number(value) || 1, 1),
						toStorage: value => Math.max(Number(value) || 1, 1)
					}
				},
				{
					batch_extract_interval_unit: {
						local_key: 'linkcase_batch_extract_interval_unit',
						fromStorage: value => (value === 'second' || value === 'minute' ? value : 'minute'),
						toStorage: value => (value === 'second' || value === 'minute' ? value : 'minute')
					}
				},
				{
					batch_action_extract_enabled: {
						local_key: 'linkcase_batch_action_extract_enabled',
						fromStorage: parseStoredBoolean,
						toStorage: value => Boolean(value)
					}
				},
				{
					batch_extract_concurrency: {
						local_key: 'linkcase_batch_extract_concurrency',
						fromStorage: value => Math.min(Math.max(Number(value) || 1, 1), 10),
						toStorage: value => Math.min(Math.max(Number(value) || 1, 1), 10)
					}
				}
			],
			this
		)

		this.util.acts = [deinit]
		void this.loadBatchTasks()
		this.startBatchClock()
		this.startBatchTaskRefresh()
		this.resetMenuSelectionState()
		this.watchSessionStatus()
		await this.reloadList()
	}

	resetMenuSelectionState() {
		this.selected_id = ''
		this.select_mode = false
		this.checked_ids = []
		this.detail = null
		this.menu_target_index = -1
	}

	setSessionDialogOpen(value: boolean) {
		this.session_dialog_open = value
	}

	resetAddDraft() {
		this.add_dialog_mode = 'add'
		this.editing_link_id = ''
		this.add_title = ''
		this.add_url = ''
		this.add_content = ''
	}

	openAddDialog() {
		this.resetAddDraft()
		this.add_dialog_open = true
	}

	openEditDialog() {
		const item = this.selected_item
		const detail = this.detail && this.detail.id === item?.id ? this.detail : null

		if (!item) {
			return
		}

		this.add_dialog_mode = 'edit'
		this.editing_link_id = item.id
		this.add_title = item.title || ''
		this.add_url = item.url || ''
		this.add_content = detail?.article?.content || ''
		this.add_dialog_open = true
	}

	setAddDialogOpen(value: boolean) {
		this.add_dialog_open = value

		if (!value && !this.add_submit_loading) {
			this.resetAddDraft()
		}
	}

	setAddTitle(value: string) {
		this.add_title = value
	}

	setAddUrl(value: string) {
		this.add_url = value
	}

	setAddContent(value: string) {
		this.add_content = value
	}

	enterSelectMode() {
		this.select_mode = true
	}

	exitSelectMode() {
		this.select_mode = false
		this.clearCheckedLinks()
	}

	isLinkChecked(id: string) {
		return this.checked_ids.includes(id)
	}

	setCheckedIds(ids: Array<string>) {
		this.checked_ids = Array.from(new Set(ids))
	}

	toggleLinkChecked(id: string, checked?: boolean) {
		const next_checked = checked ?? !this.isLinkChecked(id)
		const checked_id_set = new Set(this.checked_ids)

		if (next_checked) {
			checked_id_set.add(id)
		} else {
			checked_id_set.delete(id)
		}

		this.checked_ids = Array.from(checked_id_set)
	}

	clearCheckedLinks() {
		this.checked_ids = []
	}

	toggleCheckAllLoadedLinks() {
		if (this.all_loaded_checked) {
			const loaded_id_set = new Set(this.items.map(item => item.id))

			this.checked_ids = this.checked_ids.filter(id => !loaded_id_set.has(id))

			return
		}

		this.setCheckedIds([...this.checked_ids, ...this.items.map(item => item.id)])
	}

	setStartDialogOpen(value: boolean) {
		this.start_dialog_open = value
	}

	openBatchPanel() {
		this.batch_panel_tab = this.batch_task_count > 0 ? 'tasks' : 'create'
		this.start_dialog_open = true
		void this.loadBatchTasks()
	}

	setBatchPanelTab(value: string) {
		if (value === 'create' || value === 'tasks') {
			this.batch_panel_tab = value
		}
	}

	setSnifferDialogOpen(value: boolean) {
		this.sniffer_dialog_open = value
	}

	setSnifferSelectedFolderKeys(browser: LinkcaseSnifferBrowserId, keys: Array<string>) {
		this.sniffer_selected_folder_keys = {
			...this.sniffer_selected_folder_keys,
			[browser]: Array.from(new Set(keys))
		}
	}

	toggleSnifferFolderKeys(browser: LinkcaseSnifferBrowserId, keys: Array<string>, checked: boolean) {
		const next_keys = new Set(this.getSnifferSelectedFolderKeys(browser))

		for (const key of keys) {
			if (checked) {
				next_keys.add(key)
			} else {
				next_keys.delete(key)
			}
		}

		this.setSnifferSelectedFolderKeys(browser, Array.from(next_keys))
	}

	toggleSnifferBrowserExpanded(browser: LinkcaseSnifferBrowserId) {
		if (this.sniffer_expanded_browser_ids.includes(browser)) {
			this.sniffer_expanded_browser_ids = this.sniffer_expanded_browser_ids.filter(id => id !== browser)

			return
		}

		this.sniffer_expanded_browser_ids = [...this.sniffer_expanded_browser_ids, browser]
	}

	isSnifferBrowserExpanded(browser: LinkcaseSnifferBrowserId) {
		return this.sniffer_expanded_browser_ids.includes(browser)
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

	setBatchFetchIntervalValue(value: string) {
		this.batch_fetch_interval_value = Math.max(Number(value) || 1, 1)
	}

	setBatchFetchIntervalUnit(value: string) {
		this.batch_fetch_interval_unit = value as LinkcaseBatchIntervalUnit
	}

	setBatchExtractIntervalValue(value: string) {
		this.batch_extract_interval_value = Math.max(Number(value) || 1, 1)
	}

	setBatchExtractIntervalUnit(value: string) {
		this.batch_extract_interval_unit = value as LinkcaseBatchIntervalUnit
	}

	setBatchExtractConcurrency(value: string) {
		this.batch_extract_concurrency = Math.min(Math.max(Number(value) || 1, 1), 10)
	}

	setBatchActionFetchEnabled(value: boolean) {
		this.batch_action_fetch_enabled = value
	}

	setBatchAutoRemoveDeadLinks(value: boolean) {
		this.batch_auto_remove_dead_links = value
	}

	setBatchActionExtractEnabled(value: boolean) {
		this.batch_action_extract_enabled = value
	}

	migrateLegacyBatchConfig() {
		if (typeof window === 'undefined') {
			return
		}

		try {
			const raw = window.localStorage.getItem(linkcase_batch_config_storage_key)

			if (!raw) {
				return
			}

			const parsed = JSON.parse(raw) as Partial<LinkcaseBatchConfig>
			const migration_map = {
				batch_count: 'linkcase_batch_count',
				batch_fetch_interval_value: 'linkcase_batch_fetch_interval_value',
				batch_fetch_interval_unit: 'linkcase_batch_fetch_interval_unit',
				batch_action_fetch_enabled: 'linkcase_batch_action_fetch_enabled',
				batch_auto_remove_dead_links: 'linkcase_batch_auto_remove_dead_links',
				batch_extract_interval_value: 'linkcase_batch_extract_interval_value',
				batch_extract_interval_unit: 'linkcase_batch_extract_interval_unit',
				batch_action_extract_enabled: 'linkcase_batch_action_extract_enabled',
				batch_extract_concurrency: 'linkcase_batch_extract_concurrency'
			} satisfies Record<string, string>

			if (window.localStorage.getItem(migration_map.batch_count) === null) {
				this.batch_count = Math.min(Math.max(parsed.batch_count || 1, 1), 10)
			}

			if (window.localStorage.getItem(migration_map.batch_fetch_interval_value) === null) {
				this.batch_fetch_interval_value = Math.max(
					parsed.batch_fetch_interval_value || parsed.batch_interval_value || 1,
					1
				)
			}

			if (window.localStorage.getItem(migration_map.batch_fetch_interval_unit) === null) {
				this.batch_fetch_interval_unit =
					parsed.batch_fetch_interval_unit === 'second' ||
					parsed.batch_fetch_interval_unit === 'minute'
						? parsed.batch_fetch_interval_unit
						: parsed.batch_interval_unit === 'second' || parsed.batch_interval_unit === 'minute'
							? parsed.batch_interval_unit
							: 'minute'
			}

			if (window.localStorage.getItem(migration_map.batch_action_fetch_enabled) === null) {
				this.batch_action_fetch_enabled =
					typeof parsed.batch_action_fetch_enabled === 'boolean'
						? parsed.batch_action_fetch_enabled
						: true
			}

			if (window.localStorage.getItem(migration_map.batch_auto_remove_dead_links) === null) {
				this.batch_auto_remove_dead_links =
					typeof parsed.batch_auto_remove_dead_links === 'boolean'
						? parsed.batch_auto_remove_dead_links
						: false
			}

			if (window.localStorage.getItem(migration_map.batch_extract_interval_value) === null) {
				this.batch_extract_interval_value = Math.max(
					parsed.batch_extract_interval_value || parsed.batch_interval_value || 1,
					1
				)
			}

			if (window.localStorage.getItem(migration_map.batch_extract_interval_unit) === null) {
				this.batch_extract_interval_unit =
					parsed.batch_extract_interval_unit === 'second' ||
					parsed.batch_extract_interval_unit === 'minute'
						? parsed.batch_extract_interval_unit
						: parsed.batch_interval_unit === 'second' || parsed.batch_interval_unit === 'minute'
							? parsed.batch_interval_unit
							: 'minute'
			}

			if (window.localStorage.getItem(migration_map.batch_action_extract_enabled) === null) {
				this.batch_action_extract_enabled =
					typeof parsed.batch_action_extract_enabled === 'boolean'
						? parsed.batch_action_extract_enabled
						: false
			}

			if (window.localStorage.getItem(migration_map.batch_extract_concurrency) === null) {
				this.batch_extract_concurrency = Math.min(
					Math.max(Number(parsed.batch_extract_concurrency) || 1, 1),
					10
				)
			}
		} catch {}
	}

	startBatchClock() {
		if (this.batch_clock_timer || typeof window === 'undefined') {
			return
		}

		this.batch_clock_timer = window.setInterval(() => {
			this.batch_clock = Date.now()
		}, 1000)
	}

	stopBatchClock() {
		if (!this.batch_clock_timer) {
			return
		}

		clearInterval(this.batch_clock_timer)
		this.batch_clock_timer = 0
	}

	startBatchTaskRefresh() {
		if (this.batch_task_refresh_timer || typeof window === 'undefined') {
			return
		}

		this.batch_task_refresh_timer = window.setInterval(() => {
			void this.loadBatchTasks()
		}, 5000)
	}

	stopBatchTaskRefresh() {
		if (!this.batch_task_refresh_timer) {
			return
		}

		clearInterval(this.batch_task_refresh_timer)
		this.batch_task_refresh_timer = 0
	}

	getBatchTask(task_id: string) {
		return this.batch_tasks.find(task => task.id === task_id) ?? null
	}

	async loadBatchTasks() {
		try {
			const response = await rpc.linkcase.getSchedules.query()
			this.batch_tasks = response.tasks
			this.batch_last_error = ''
		} catch (error) {
			this.batch_last_error = error instanceof Error ? error.message : 'Failed to load scheduled tasks'
		}
	}

	getBatchTaskActionLabel(action: LinkcaseBatchAction) {
		return action === 'fetch' ? 'Fetch' : 'Extract'
	}

	formatBatchAbsoluteTime(value: string | null) {
		if (!value) {
			return 'Never'
		}

		return new Date(value).toLocaleString()
	}

	formatBatchRelativeTime(value: string | null) {
		if (!value) {
			return 'not scheduled'
		}

		const diff_ms = Math.max(new Date(value).getTime() - this.batch_clock, 0)
		const total_seconds = Math.ceil(diff_ms / 1000)

		if (total_seconds < 60) {
			return `${total_seconds}s`
		}

		const minutes = Math.floor(total_seconds / 60)
		const seconds = total_seconds % 60

		if (minutes < 60) {
			return seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m`
		}

		const hours = Math.floor(minutes / 60)
		const remain_minutes = minutes % 60

		return remain_minutes > 0 ? `${hours}h ${remain_minutes}m` : `${hours}h`
	}

	getBatchTaskStatusText(task: LinkcaseBatchTask) {
		if (task.last_status === 'running') {
			return 'Running now'
		}

		if (!task.enabled) {
			return 'Paused'
		}

		if (task.next_run_at) {
			return `Next in ${this.formatBatchRelativeTime(task.next_run_at)}`
		}

		return 'Waiting to schedule'
	}

	async startBatchSchedule() {
		if (!this.batch_action_fetch_enabled && !this.batch_action_extract_enabled) {
			toast.error('Select at least one batch action.')

			return
		}

		try {
			const creates = [] as Array<Promise<unknown>>

			if (this.batch_action_fetch_enabled) {
				creates.push(
					rpc.linkcase.createSchedule.mutate({
						action: 'fetch',
						interval_value: this.batch_fetch_interval_value,
						interval_unit: this.batch_fetch_interval_unit,
						count: this.batch_count,
						auto_remove_dead_links: this.batch_auto_remove_dead_links
					})
				)
			}

			if (this.batch_action_extract_enabled) {
				creates.push(
					rpc.linkcase.createSchedule.mutate({
						action: 'extract',
						interval_value: this.batch_extract_interval_value,
						interval_unit: this.batch_extract_interval_unit,
						count: this.batch_count,
						auto_remove_dead_links: false,
						extract_concurrency: this.batch_extract_concurrency
					})
				)
			}

			await Promise.all(creates)
			await this.loadBatchTasks()
			this.batch_last_error = ''
			this.batch_panel_tab = 'tasks'
			toast.success(`Added ${creates.length} scheduled task${creates.length === 1 ? '' : 's'}.`)
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Failed to create scheduled tasks'
			this.batch_last_error = message
			toast.error(message)
		}
	}

	async toggleBatchTaskEnabled(task_id: string) {
		const task = this.getBatchTask(task_id)

		if (!task) {
			return
		}

		try {
			await rpc.linkcase.updateSchedule.mutate({
				id: task.id,
				enabled: !task.enabled
			})
			await this.loadBatchTasks()
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Failed to update scheduled task'
			this.batch_last_error = message
			toast.error(message)
		}
	}

	async removeBatchTask(task_id: string) {
		try {
			await rpc.linkcase.removeSchedule.mutate({ id: task_id })
			await this.loadBatchTasks()
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Failed to remove scheduled task'
			this.batch_last_error = message
			toast.error(message)
		}
	}

	getSnifferStatus(browser: LinkcaseSnifferBrowserId) {
		return this.sniffer_statuses.find(item => item.id === browser) ?? null
	}

	getSnifferBrowserFolderKeys(browser: LinkcaseSnifferBrowserId) {
		const status = this.getSnifferStatus(browser)

		return status ? getLinkcaseSnifferBrowserFolderKeys(status) : []
	}

	getSnifferSelectedFolderKeys(browser: LinkcaseSnifferBrowserId) {
		return this.sniffer_selected_folder_keys[browser] ?? []
	}

	getSnifferSelectedFolderCount(browser: LinkcaseSnifferBrowserId) {
		return this.getSnifferSelectedFolderKeys(browser).length
	}

	getSnifferFolderSelectionState(browser: LinkcaseSnifferBrowserId, folder_keys: Array<string>) {
		if (folder_keys.length === 0) {
			return 'unchecked' as const
		}

		const selected = new Set(this.getSnifferSelectedFolderKeys(browser))
		const selected_count = folder_keys.filter(key => selected.has(key)).length

		if (selected_count === 0) {
			return 'unchecked' as const
		}

		if (selected_count === folder_keys.length) {
			return 'checked' as const
		}

		return 'indeterminate' as const
	}

	getSnifferSelectedFolderKeysForImport(browser: LinkcaseSnifferBrowserId) {
		return this.getSnifferSelectedFolderKeys(browser)
	}

	syncSnifferSelections(statuses: Array<LinkcaseSnifferBrowserStatus>) {
		const next_selections = { ...this.sniffer_selected_folder_keys }

		for (const status of statuses) {
			const all_keys = getLinkcaseSnifferBrowserFolderKeys(status)
			const existing_keys = next_selections[status.id] ?? []
			const filtered_keys = existing_keys.filter(key => all_keys.includes(key))
			const has_existing = Object.prototype.hasOwnProperty.call(next_selections, status.id)

			next_selections[status.id] = has_existing ? filtered_keys : all_keys
		}

		this.sniffer_selected_folder_keys = next_selections
	}

	toListItem(item: LinkcaseItem | LinkcaseDetail): LinkcaseItem {
		return {
			id: item.id,
			hash: item.hash,
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
		const previous_selected_id = this.selected_id
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
				this.menu_target_index = -1
			}

			const loaded_id_set = new Set(this.items.map(item => item.id))
			this.checked_ids = this.checked_ids.filter(id => loaded_id_set.has(id))

			if (this.items.length === 0) {
				this.selected_id = ''
				this.checked_ids = []
				this.detail = null

				return
			}

			const next_selected_id = this.items.some(item => item.id === this.selected_id)
				? this.selected_id
				: this.items[0].id

			this.selected_id = next_selected_id

			const should_reload_detail =
				!append &&
				(next_selected_id !== previous_selected_id ||
					!this.detail ||
					this.detail.id !== next_selected_id)

			if (should_reload_detail) {
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

	loadMoreList() {
		if (this.loading || this.loading_more || !this.has_more) {
			return
		}

		void this.loadList({ append: true })
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

	async extractSelectedLink() {
		if (!this.selected_id) {
			return
		}

		const item = this.selected_item
		const has_content = Boolean(this.detail?.article?.content?.trim())

		if (!item || !has_content || this.current_extracting_id) {
			return
		}

		this.current_extracting_id = item.id

		try {
			const result = await rpc.linkcase.extract.mutate({
				id: item.id,
				force: true
			})

			await this.loadDetail(item.id)
			this.patchBatchResult({
				ok: true,
				fetch_count: 0,
				extract_count: 1,
				fetched: [],
				extracted: [result]
			})

			if (result.queued) {
				toast.success(
					`Queued extract for ${result.title || result.url}. Pipeline will continue in the background.`
				)
			} else {
				toast.success(
					`Extracted ${result.title || result.url} with ${result.triple_count} triple${result.triple_count === 1 ? '' : 's'}.`
				)
			}
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Failed to extract link content')
		} finally {
			this.current_extracting_id = ''
		}
	}

	async fetchSelectedLinkByAI() {
		if (!this.selected_id) {
			return
		}

		const item = this.selected_item

		if (!item) {
			return
		}

		if (
			this.current_ai_fetching_id ||
			this.selection_fetch_submit_loading ||
			this.batch_submit_loading ||
			this.linkcase_session_running
		) {
			toast.error('Linkcase batch session is busy. Wait for the current run to finish.')

			return
		}

		this.current_ai_fetching_id = item.id
		this.batch_last_error = ''
		this.batch_last_run_at = Date.now()

		try {
			await this.submitSessionPrompt(this.buildAIFetchPrompt(item))
			this.batch_runs += 1
			this.session_dialog_open = true
			toast.success(`Submitted AI fetch for ${item.title || item.url}.`)
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error)

			this.batch_last_error = message
			toast.error(message)
		} finally {
			this.current_ai_fetching_id = ''
		}
	}

	async loadSnifferStatus() {
		this.sniffer_status_loading = true

		try {
			const response = await rpc.sniffer.status.query()

			this.sniffer_statuses = response.browsers
			this.syncSnifferSelections(response.browsers)
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

		const folder_keys = this.getSnifferSelectedFolderKeysForImport(browser)

		if (folder_keys.length === 0) {
			toast.error('Select at least one bookmark folder.')

			return
		}

		this.sniffer_importing_browser = browser

		try {
			const result = await rpc.sniffer.importBookmarks.mutate({
				browser,
				folder_keys
			})
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

	async submitLinkDialog() {
		if (this.add_submit_loading) {
			return
		}

		const url = this.add_url.trim()
		const title = this.add_title.trim() || undefined
		const content = this.add_content.trim()
		const editing_id = this.editing_link_id
		const editing = this.add_dialog_mode === 'edit' && Boolean(editing_id)

		if (!url) {
			toast.error('Link is required.')

			return
		}

		this.add_submit_loading = true

		try {
			const response = editing
				? await rpc.linkcase.update.mutate({
						id: editing_id,
						url,
						title,
						content
					})
				: await rpc.linkcase.create.mutate({
						url,
						title,
						content: content || undefined
					})

			if (!response) {
				throw new Error(editing ? 'Failed to update link.' : 'Failed to create link.')
			}

			this.selected_id = response.id
			this.detail = response
			this.add_dialog_open = false
			this.resetAddDraft()

			await this.reloadList()
			toast.success(`${editing ? 'Updated' : 'Added'} ${response.title || response.url}.`)
		} catch (error) {
			toast.error(
				error instanceof Error
					? error.message
					: editing
						? 'Failed to update link'
						: 'Failed to add link'
			)
		} finally {
			this.add_submit_loading = false
		}
	}

	async removeLink(id: string) {
		await this.removeLinks([id])
	}

	buildTargetFetchPrompt(items: Array<LinkcaseItem>) {
		return [
			'Run one targeted Linkcase batch fetch.',
			`Process exactly these target ids and do not replace them with other candidates: ${JSON.stringify(items.map(item => item.id))}.`,
			'For each target, use the AI-guided preview workflow: fetch_preview, optionally read_preview, then commit_preview or mark_failed.',
			'Judge whether the final fetched result actually matches the target content, and call out clearly if it does not.',
			'When evaluating fetched content, keep only the main topic content and ignore unrelated noise.',
			'fetch_preview caches up to 200000 characters for one provider. If the first page is noisy, use linkcase_tool action "read_preview" on the same preview_key to inspect later 30000-character pages before trying another provider.',
			'If a provider preview already contains the correct and substantially complete target article body, stop the provider chain immediately and commit that preview.',
			'Do not keep testing later providers just to search for cleaner formatting or less trailing boilerplate.',
			'Before commit_preview, rewrite the fetched result into cleaned markdown that keeps only the core article body.',
			'Filter out website navigation, menus, login prompts, ads, sponsored blocks, popups, cookie notices, footers, tag pages, related links, recommendation feeds, share widgets, author cards, post navigation, comment sections, subscribe prompts, and other non-target information.',
			'The saved result should keep only the core article body. It is acceptable to remove or rewrite non-body formatting so long as the article meaning stays intact.',
			'Do not call commit_preview without passing the cleaned core body in the content field.',
			'If a result is dominated by noise and the target article body is still absent or unusably incomplete after checking relevant preview pages, treat it as a bad fetch and say so clearly.',
			'Return a concise summary with id, title, status, source, error, article_id, and your quality judgment.',
			'Targets:',
			...items.map((item, index) => `${index + 1}. ${item.id} | ${item.title || item.url} | ${item.url}`)
		].join('\n')
	}

	buildAIFetchPrompt(item: LinkcaseItem) {
		return [
			'Run one AI-guided Linkcase fetch for exactly one target link.',
			`Target id: ${item.id}`,
			`Target title: ${item.title || item.url}`,
			`Target url: ${item.url}`,
			'Use the Linkcase batch session AI fetch workflow for this target.',
			'fetch_preview caches up to 200000 characters for one provider. If the first page is noisy, use linkcase_tool action "read_preview" on the same preview_key to inspect later 30000-character pages before trying another provider.',
			'If one provider preview already shows the correct and substantially complete target article body, commit it immediately and do not continue to later providers.',
			'Do not continue to other providers only because they might look cleaner or contain less trailing boilerplate.',
			'The target output should focus on the page main content only.',
			'Never save raw fetched preview text directly.',
			'Before commit_preview, rewrite the fetched result into cleaned markdown that keeps only the core article body.',
			'Filter out unrelated noise such as site navigation, category links, headers, footers, ads, sponsored content, popups, cookie banners, related reading, recommendation feeds, share widgets, author cards, post navigation, comment sections, subscribe prompts, and other boilerplate that is not central to the target topic.',
			'The saved result should keep only the core article body. It is acceptable to remove or rewrite non-body formatting so long as the article meaning stays intact.',
			'Do not call commit_preview without passing the cleaned core body in the content field.',
			'If a provider result still lacks the target body after you inspect relevant preview pages, do not accept it as the final fetch result.',
			'Return a concise summary with provider attempts, final decision, status, source, and article_id if committed.'
		].join('\n')
	}

	async fetchLinksBySession(ids: Array<string>) {
		const unique_ids = Array.from(new Set(ids))
		const target_items = this.items.filter(item => unique_ids.includes(item.id))

		if (target_items.length === 0) {
			return
		}

		if (this.selection_fetch_submit_loading || this.batch_submit_loading || this.linkcase_session_running) {
			toast.error('Linkcase batch session is busy. Wait for the current run to finish.')

			return
		}

		this.selection_fetch_submit_loading = true
		this.batch_last_error = ''
		this.batch_last_run_at = Date.now()

		try {
			await this.submitSessionPrompt(this.buildTargetFetchPrompt(target_items))
			this.batch_runs += 1
			this.session_dialog_open = true
			toast.success(`Submitted ${target_items.length} link(s) to Linkcase batch session.`)
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error)

			this.batch_last_error = message
			toast.error(message)
		} finally {
			this.selection_fetch_submit_loading = false
		}
	}

	async fetchCheckedLinks() {
		await this.fetchLinksBySession(this.checked_ids)
	}

	async fetchMenuLinks() {
		await this.fetchLinksBySession(this.menu_action_ids)
	}

	applyRemovedLinks(ids: Array<string>) {
		const removed_id_set = new Set(ids)
		const previous_items = this.items
		const selected_removed = this.selected_id ? removed_id_set.has(this.selected_id) : false
		const selected_index = previous_items.findIndex(item => item.id === this.selected_id)

		this.items = previous_items.filter(item => !removed_id_set.has(item.id))
		this.checked_ids = this.checked_ids.filter(id => !removed_id_set.has(id))
		this.menu_target_index = -1

		if (this.items.length === 0) {
			this.selected_id = ''
			this.detail = null

			return
		}

		if (!selected_removed && this.items.some(item => item.id === this.selected_id)) {
			return
		}

		const next_item =
			previous_items.slice(selected_index + 1).find(item => !removed_id_set.has(item.id)) ??
			previous_items
				.slice(0, Math.max(selected_index, 0))
				.reverse()
				.find(item => !removed_id_set.has(item.id)) ??
			this.items[0]

		this.selected_id = next_item?.id ?? ''
		this.detail = null

		if (next_item) {
			void this.loadDetail(next_item.id)
		}
	}

	async removeLinks(ids: Array<string>) {
		const unique_ids = Array.from(new Set(ids))
		const target_items = this.items.filter(item => unique_ids.includes(item.id))
		const count = target_items.length

		if (count === 0 || this.selection_remove_loading) {
			return
		}

		const confirmed = await alert({
			title: count > 1 ? 'Remove Links' : 'Remove Link',
			desc:
				count > 1
					? `Remove ${count} links and their unattached fetched articles?`
					: `Remove ${target_items[0]?.title || target_items[0]?.url || 'this link'} and its unattached fetched articles?`
		})

		if (!confirmed) {
			return
		}

		this.selection_remove_loading = true
		const removed_ids = [] as Array<string>

		try {
			for (const id of unique_ids) {
				const response = await rpc.linkcase.remove.mutate({ id })

				if (response) {
					removed_ids.push(id)
				}
			}

			this.applyRemovedLinks(removed_ids)

			if (removed_ids.length > 0) {
				toast.success(`Removed ${removed_ids.length} link(s).`)
			}
		} catch (error) {
			if (removed_ids.length > 0) {
				this.applyRemovedLinks(removed_ids)
			}

			toast.error(error instanceof Error ? error.message : 'Failed to remove selected links')
		} finally {
			this.selection_remove_loading = false
		}
	}

	async removeCheckedLinks() {
		await this.removeLinks(this.checked_ids)
	}

	async removeMenuLinks() {
		await this.removeLinks(this.menu_action_ids)
	}

	onMenuScroll(event: UIEvent<HTMLDivElement>) {
		const element = event.currentTarget

		if (element.scrollTop + element.clientHeight < element.scrollHeight - 120) {
			return
		}

		this.loadMoreList()
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

	patchBatchResult(result: LinkcaseBatchRunResult) {
		const next_selected_id = this.selected_id

		for (const item of result.fetched) {
			const current_index = this.items.findIndex(current => current.id === item.id)

			if (current_index === -1) {
				continue
			}

			const current_item = this.items[current_index]

			this.items[current_index] = {
				...current_item,
				status: item.status
			}
		}

		for (const item of result.extracted) {
			const current_index = this.items.findIndex(current => current.id === item.id)

			if (current_index === -1) {
				continue
			}

			const current_item = this.items[current_index]

			if (!current_item.article) {
				continue
			}

			this.items[current_index] = {
				...current_item,
				article: {
					...current_item.article,
					id: item.article_id,
					is_pipelined: item.is_pipelined
				}
			}
		}

		if (next_selected_id) {
			void this.loadDetail(next_selected_id)
		}
	}

	async submitSessionPrompt(text: string) {
		const message = {
			id: crypto.randomUUID(),
			role: 'user',
			parts: [{ type: 'text', text }]
		} satisfies Message

		const response = await fetch(server_sys_session_url, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				id: this.global_session_id,
				message,
				archive_before_submit: true
			})
		})

		if (!response.ok) {
			throw new Error(`Batch session submit failed: ${response.status}`)
		}

		this.consumeSessionResponse(response)
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
			void (async () => {
				await this.loadBatchTasks()
				await this.reloadList()

				if (this.selected_id) {
					await this.loadDetail(this.selected_id)
				}
			})()
		}
	}

	deinit() {
		if (this.search_timer) {
			clearTimeout(this.search_timer)
			this.search_timer = 0
		}

		this.resetMenuSelectionState()
		this.stopBatchClock()
		this.stopBatchTaskRefresh()
		this.util.deinit()
	}
}

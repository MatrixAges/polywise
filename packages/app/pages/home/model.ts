import { makeAutoObservable } from 'mobx'
import { injectable } from 'tsyringe'

import GlobalModel from '@/models/global'
import { formatDateTime, fromNow, rpc } from '@/utils'

import type {
	HomeModelItem,
	HomeOverviewCard,
	HomeRecentNotificationItem,
	HomeRecentPostItem,
	HomeRecentSessionItem,
	HomeRuntimeItem,
	HomeSnapshot
} from './types'

const compact_formatter = Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 })

const weekday_label_map = {
	sun: 'Sunday',
	mon: 'Monday',
	tue: 'Tuesday',
	wed: 'Wednesday',
	thu: 'Thursday',
	fri: 'Friday',
	sat: 'Saturday'
} as const

const formatCompact = (value: number) => compact_formatter.format(value)
const formatInteger = (value: number) => value.toLocaleString('en-US')

@injectable()
export default class Index {
	loading = false
	snapshot = null as HomeSnapshot | null
	last_loaded_at = 0

	constructor(public global: GlobalModel) {
		makeAutoObservable(this, { global: false }, { autoBind: true })
	}

	get data() {
		return this.snapshot
	}

	get pthink_config() {
		return this.global.setting.config?.pthink
	}

	get pthink_enabled() {
		return Boolean(this.pthink_config?.enabled)
	}

	get pthink_idle_mins() {
		return Math.round((this.pthink_config?.idle_grace_ms ?? 20 * 60 * 1000) / 60000)
	}

	get pthink_weekly_day() {
		return weekday_label_map[this.pthink_config?.weekly_report_weekday ?? 'sun']
	}

	get pthink_last_label() {
		const last_summary = this.data?.pthink.status.last_summary

		if (last_summary?.created_at && last_summary.title) {
			return `${last_summary.title} · ${fromNow(last_summary.created_at)}`
		}

		return 'No report generated yet'
	}

	get pthink_runtime_label() {
		const status = this.data?.pthink.status

		if (!status) {
			return 'Runtime status unavailable'
		}

		const detail: string[] = [status.last_status]

		if (status.last_reason) {
			detail.push(status.last_reason)
		}

		if (status.last_error) {
			detail.push(status.last_error)
		}

		return `Runtime status: ${detail.join(' · ')}`
	}

	get last_loaded_label() {
		return this.last_loaded_at ? formatDateTime(this.last_loaded_at, 'YYYY-MM-DD HH:mm') : 'not loaded'
	}

	get overview_cards(): Array<HomeOverviewCard> {
		if (!this.data) {
			return []
		}

		return [
			{
				key: 'sessions',
				title: 'Sessions',
				value: formatCompact(this.data.overview.session_total),
				desc: `${this.data.overview.sessions_running} running · ${this.data.overview.sessions_unread} unread · ${this.data.overview.sessions_week} created this week`
			},
			{
				key: 'tokens',
				title: 'Tokens',
				value: formatCompact(this.data.usage.total_tokens),
				desc: `${formatCompact(this.data.usage.week_total_tokens)} this week · avg ${formatCompact(this.data.usage.avg_total_tokens_per_reply)} per assistant reply`
			},
			{
				key: 'content',
				title: 'Content',
				value: formatCompact(this.data.content.article_total + this.data.content.document_total),
				desc: `${this.data.content.document_total} docs · ${this.data.content.article_total} articles · ${this.data.content.chunk_total} chunks`
			},
			{
				key: 'memory',
				title: 'Memory Graph',
				value: formatCompact(this.data.memory.node_total + this.data.memory.edge_total),
				desc: `${this.data.memory.node_total} nodes · ${this.data.memory.edge_total} edges · ${this.data.memory.rewire_event_week} rewire events this week`
			}
		]
	}

	get usage_metrics(): Array<HomeModelItem> {
		if (!this.data) {
			return []
		}

		return [
			{ key: 'total', title: 'Total', value: formatCompact(this.data.usage.total_tokens) },
			{ key: 'input', title: 'Input', value: formatCompact(this.data.usage.input_tokens) },
			{ key: 'output', title: 'Output', value: formatCompact(this.data.usage.output_tokens) },
			{ key: 'reasoning', title: 'Reasoning', value: formatCompact(this.data.usage.reasoning_tokens) }
		]
	}

	get top_models() {
		return (this.data?.usage.models ?? []).map(item => ({
			key: item.key,
			title: item.label,
			subtitle: `${item.calls} calls · source ${item.source}`,
			value: formatCompact(item.total_tokens),
			meta: 'tokens'
		}))
	}

	get top_providers() {
		return (this.data?.usage.providers ?? []).map(item => ({
			key: item.provider,
			title: item.provider,
			subtitle: `${item.calls} calls`,
			value: formatCompact(item.total_tokens)
		}))
	}

	get usage_footer() {
		if (!this.data) {
			return ''
		}

		return `Cached input ${formatCompact(this.data.usage.cached_input_tokens)} · assistant replies ${this.data.usage.assistant_messages}`
	}

	get posts_total() {
		if (!this.data) {
			return '0'
		}

		const counts = this.data.content.post_for_counts

		return formatCompact(counts.user + counts.wiki + counts.memory)
	}

	get posts_meta() {
		if (!this.data) {
			return ''
		}

		const counts = this.data.content.post_for_counts

		return `User ${counts.user} · Wiki ${counts.wiki} · Memory ${counts.memory}`
	}

	get posts_pipeline_meta() {
		return this.data
			? `${this.data.content.posts_pending} posts are still waiting for pipeline completion.`
			: ''
	}

	get pipeline_total() {
		return this.data
			? formatCompact(this.data.content.documents_pending + this.data.content.articles_pending)
			: '0'
	}

	get pipeline_meta() {
		if (!this.data) {
			return ''
		}

		return `${this.data.content.documents_pending} documents pending · ${this.data.content.articles_pending} non-post articles pending`
	}

	get pipeline_detail() {
		return this.data
			? `Average ${this.data.content.avg_chunks_per_article} chunks per article · ${this.data.content.long_article_total} long articles`
			: ''
	}

	get linkcase_total() {
		return this.data ? formatCompact(this.data.content.link_total) : '0'
	}

	get linkcase_meta() {
		return this.data
			? `${this.data.content.link_ready_total} ready · ${this.data.content.link_pending_total} waiting or pending`
			: ''
	}

	get system_footprint_total() {
		return this.data
			? formatCompact(
					this.data.system.agent_total +
						this.data.system.project_total +
						this.data.system.skill_total
				)
			: '0'
	}

	get system_footprint_meta() {
		return this.data
			? `${this.data.system.agent_total} agents · ${this.data.system.project_total} projects · ${this.data.system.skill_total} skills`
			: ''
	}

	get system_footprint_detail() {
		return this.data
			? `${this.data.system.group_total} groups · ${this.data.system.im_account_enabled}/${this.data.system.im_account_total} IM accounts enabled`
			: ''
	}

	get recent_sessions(): Array<HomeRecentSessionItem> {
		return (this.data?.recent.sessions ?? []).map(item => ({
			...item,
			updated_label: fromNow(item.updated_at),
			status_label: item.is_runing
				? 'Running'
				: item.unread
					? 'Unread'
					: item.is_im
						? 'IM'
						: item.is_cron
							? 'Cron'
							: 'Idle'
		}))
	}

	get recent_posts(): Array<HomeRecentPostItem> {
		return (this.data?.recent.posts ?? []).map(item => ({
			...item,
			updated_label: fromNow(item.updated_at),
			status_label: item.is_pipelined ? 'pipelined' : 'pending pipeline'
		}))
	}

	get recent_notifications(): Array<HomeRecentNotificationItem> {
		return (this.data?.recent.notifications ?? []).map(item => ({
			...item,
			created_label: fromNow(item.created_at),
			status_label: item.is_read ? 'Read' : 'Unread'
		}))
	}

	get recent_reports() {
		return (this.data?.recent.pthink_reports ?? []).map(item => ({
			...item,
			created_label: fromNow(item.created_at),
			meta_label:
				item.kind === 'trigger' && item.trigger_key
					? `trigger · ${item.trigger_key}`
					: item.kind || 'report'
		}))
	}

	get ops_items(): Array<HomeModelItem> {
		if (!this.data) {
			return []
		}

		return [
			{
				key: 'notifications',
				title: 'Unread notifications',
				value: String(this.data.system.notification_unread)
			},
			{
				key: 'peers',
				title: 'Connected peers',
				value: String(this.data.system.im_peer_total)
			},
			{
				key: 'accounts',
				title: 'Enabled IM accounts',
				value: `${this.data.system.im_account_enabled}/${this.data.system.im_account_total}`
			}
		]
	}

	get node_total_label() {
		return this.data ? formatInteger(this.data.memory.node_total) : '0'
	}

	get edge_total_label() {
		return this.data ? formatInteger(this.data.memory.edge_total) : '0'
	}

	get pthink_runtime_items(): Array<HomeRuntimeItem> {
		if (!this.data) {
			return []
		}

		return [
			{
				key: 'reports',
				label: 'Reports today/week/total',
				value: `${this.data.pthink.report_today} / ${this.data.pthink.report_week} / ${this.data.pthink.report_total}`
			},
			{
				key: 'trigger',
				label: 'Trigger insights',
				value: this.pthink_config?.trigger_enabled ? 'enabled' : 'disabled'
			},
			{
				key: 'cap',
				label: 'Max reports per day',
				value: String(this.pthink_config?.max_reports_per_day ?? 3)
			},
			{
				key: 'last-report',
				label: 'Last report',
				value: this.pthink_last_label
			},
			{
				key: 'refresh',
				label: 'Last snapshot refresh',
				value: this.last_loaded_label
			}
		]
	}

	init() {
		void this.refresh()
	}

	async refresh() {
		this.loading = true

		try {
			this.snapshot = await rpc.home.query.query()
			this.last_loaded_at = Date.now()
		} finally {
			this.loading = false
		}
	}

	deinit() {}
}

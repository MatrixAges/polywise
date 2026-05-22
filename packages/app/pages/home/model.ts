import { makeAutoObservable, toJS } from 'mobx'
import { injectable } from 'tsyringe'

import GlobalModel from '@/models/global'
import { formatDateTime, fromNow, rpc } from '@/utils'

import type { ChartConfig } from '@/__shadcn__/components/ui/chart'
import type {
	HomeActiveProjectItem,
	HomeActiveSessionItem,
	HomeModelItem,
	HomeOverviewCard,
	HomeRecentNotificationItem,
	HomeRecentPostItem,
	HomeRecentSessionItem,
	HomeRuntimeItem,
	HomeSnapshot,
	HomeTrendPoint
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
const formatPercent = (value: number) => `${value.toFixed(value % 1 === 0 ? 0 : 1)}%`

const token_trend_config = {
	total_tokens: { label: 'Total tokens', color: '#f59e0b' },
	input_tokens: { label: 'Input', color: '#38bdf8' },
	output_tokens: { label: 'Output', color: '#34d399' },
	reasoning_tokens: { label: 'Reasoning', color: '#f97316' }
} satisfies ChartConfig

const activity_trend_config = {
	messages: { label: 'Messages', color: '#6366f1' },
	new_posts: { label: 'Posts', color: '#10b981' },
	new_sessions: { label: 'Sessions', color: '#8b5cf6' },
	rewire_events: { label: 'Rewires', color: '#f43f5e' }
} satisfies ChartConfig

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

		const pending_total =
			this.data.content.documents_pending +
			this.data.content.articles_pending +
			this.data.content.posts_pending
		const post_counts = this.data.content.post_for_counts

		return [
			{
				key: 'sessions',
				title: 'Sessions',
				value: formatCompact(this.data.overview.session_total),
				desc: `${this.data.overview.sessions_today} today · ${this.data.overview.sessions_week} this week`
			},
			{
				key: 'running',
				title: 'Running',
				value: formatInteger(this.data.overview.sessions_running),
				desc: `${this.data.overview.sessions_im} IM · ${this.data.overview.sessions_cron} cron · ${this.data.overview.sessions_with_messages_week} active this week`
			},
			{
				key: 'unread',
				title: 'Unread',
				value: formatInteger(this.data.overview.sessions_unread),
				desc: `${this.data.overview.stale_unread_sessions_24h} stale 24h · ${this.data.overview.stale_unread_sessions_72h} stale 72h`
			},
			{
				key: 'messages',
				title: 'Messages',
				value: formatCompact(this.data.overview.message_total),
				desc: `${formatCompact(this.data.overview.messages_today)} today · ${formatCompact(this.data.overview.messages_week)} this week`
			},
			{
				key: 'tokens',
				title: 'Tokens',
				value: formatCompact(this.data.usage.total_tokens),
				desc: `${formatCompact(this.data.usage.week_total_tokens)} this week · ${formatCompact(this.data.usage.avg_total_tokens_per_reply)} per reply`
			},
			{
				key: 'posts',
				title: 'Posts',
				value: formatCompact(post_counts.user + post_counts.wiki + post_counts.memory),
				desc: `${post_counts.user} user · ${post_counts.wiki} wiki · ${post_counts.memory} memory`
			},
			{
				key: 'pipeline',
				title: 'Pipeline',
				value: formatCompact(pending_total),
				desc: `${this.data.health.backlog_pending_total} queued · score ${this.data.health.backlog_pressure_score}`
			},
			{
				key: 'graph',
				title: 'Graph',
				value: formatCompact(this.data.memory.node_total + this.data.memory.edge_total),
				desc: `+${this.data.memory.node_week_total} nodes · +${this.data.memory.edge_week_total} edges this week`
			}
		]
	}

	get trends(): Array<HomeTrendPoint> {
		return this.data?.trends ? toJS(this.data.trends) : []
	}

	get token_trend_config() {
		return token_trend_config
	}

	get activity_trend_config() {
		return activity_trend_config
	}

	get token_trend_summary() {
		if (!this.data) {
			return ''
		}

		return `Last 14 days · ${formatCompact(this.data.usage.total_tokens)} tokens · ${this.data.usage.assistant_messages} assistant replies`
	}

	get activity_trend_summary() {
		if (!this.data) {
			return ''
		}

		const totals = this.trends.reduce(
			(acc, item) => {
				acc.messages += item.messages
				acc.sessions += item.new_sessions
				acc.posts += item.new_posts
				acc.rewire += item.rewire_events

				return acc
			},
			{ messages: 0, sessions: 0, posts: 0, rewire: 0 }
		)

		return `Last 14 days · ${totals.messages.toLocaleString('en-US')} messages · ${totals.sessions.toLocaleString('en-US')} sessions · ${totals.posts.toLocaleString('en-US')} posts · ${totals.rewire.toLocaleString('en-US')} rewires`
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

		return `Cached input ${formatCompact(this.data.usage.cached_input_tokens)} · ${formatCompact(this.data.activity.today.tokens)} tokens today · ${this.data.usage.assistant_messages} assistant replies`
	}

	get posts_total() {
		if (!this.data) {
			return '0'
		}

		return formatCompact(this.data.content.post_total)
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
			? `${this.data.content.posts_ready_total} ready · ${this.data.content.posts_pending} pending · ${formatPercent(this.data.content.post_completion_rate)} completion`
			: ''
	}

	get pipeline_total() {
		return this.data ? formatCompact(this.data.health.backlog_pending_total) : '0'
	}

	get pipeline_meta() {
		if (!this.data) {
			return ''
		}

		return `${this.data.content.documents_pending} documents · ${this.data.content.articles_pending} articles · ${this.data.content.posts_pending} posts pending`
	}

	get pipeline_detail() {
		return this.data
			? `Score ${this.data.health.backlog_pressure_score} · ${this.data.system.notification_unread} unread notifications`
			: ''
	}

	get linkcase_total() {
		return this.data ? formatCompact(this.data.content.link_total) : '0'
	}

	get linkcase_meta() {
		return this.data
			? `${this.data.content.link_ready_total} ready · ${this.data.content.link_pending_total} waiting · ${this.data.content.link_fail_total} failed`
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
			? `${this.data.system.group_total} groups · ${this.data.system.notification_pushed}/${this.data.system.notification_total} notifications pushed`
			: ''
	}

	get asset_health_items(): Array<HomeModelItem> {
		if (!this.data) {
			return []
		}

		return [
			{
				key: 'docs',
				title: 'Docs / Articles / Chunks',
				value: `${formatCompact(this.data.content.document_total)} / ${formatCompact(this.data.content.article_total)} / ${formatCompact(this.data.content.chunk_total)}`,
				desc: `${this.data.content.avg_chunks_per_article} avg chunks per article`
			},
			{
				key: 'completion',
				title: 'Post completion',
				value: formatPercent(this.data.content.post_completion_rate),
				desc: `${this.data.content.posts_ready_total} ready · ${this.data.content.posts_pending} pending`
			},
			{
				key: 'streak',
				title: 'Creation streak',
				value: `${this.data.content.post_streak_days}d`,
				desc:
					this.data.content.days_since_last_post === null
						? 'No organic post yet'
						: `${this.data.content.days_since_last_post} days since last post update`
			}
		]
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
			status_label: item.is_pipelined ? 'Ready' : 'Pending pipeline'
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

	get active_projects(): Array<HomeActiveProjectItem> {
		return (this.data?.activity.top_projects ?? []).map(item => ({
			...item,
			updated_label: fromNow(item.last_message_at)
		}))
	}

	get active_sessions(): Array<HomeActiveSessionItem> {
		return (this.data?.activity.top_sessions ?? []).map(item => ({
			...item,
			updated_label: fromNow(item.last_message_at)
		}))
	}

	get signal_cards(): Array<HomeModelItem> {
		if (!this.data) {
			return []
		}

		return [
			{
				key: 'alert',
				title: 'Top alert',
				value: this.data.health.top_alert?.label ?? 'Quiet',
				desc: this.data.health.top_alert?.detail ?? 'No trigger signal above the threshold right now.'
			},
			{
				key: 'backlog',
				title: 'Backlog pressure',
				value: String(this.data.health.backlog_pending_total),
				desc: `Score ${this.data.health.backlog_pressure_score}`
			},
			{
				key: 'stale',
				title: 'Stale unread',
				value: `${this.data.health.stale_unread_sessions_24h}/${this.data.health.stale_unread_sessions_72h}`,
				desc: '24h / 72h sessions waiting for follow-up'
			},
			{
				key: 'delivery',
				title: 'Push rate',
				value: formatPercent(this.data.health.notification_push_rate),
				desc: `${this.data.system.notification_pushed} pushed · ${this.data.system.notification_unpushed} waiting`
			},
			{
				key: 'focus',
				title: 'Project focus',
				value: formatPercent(this.data.activity.project_focus_concentration),
				desc: 'Top project share of weekly project messages'
			}
		]
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
			},
			{
				key: 'delivery',
				title: 'Push delivery',
				value: formatPercent(this.data.health.notification_push_rate)
			}
		]
	}

	get node_total_label() {
		return this.data ? formatInteger(this.data.memory.node_total) : '0'
	}

	get edge_total_label() {
		return this.data ? formatInteger(this.data.memory.edge_total) : '0'
	}

	get memory_health_items(): Array<HomeModelItem> {
		if (!this.data) {
			return []
		}

		return [
			{
				key: 'growth',
				title: 'Weekly growth',
				value: `+${this.data.memory.node_week_total} / +${this.data.memory.edge_week_total}`,
				desc: 'Nodes / edges created this week'
			},
			{
				key: 'state',
				title: 'Silent / unstable edges',
				value: `${this.data.memory.silent_edge_total} / ${this.data.memory.unstable_edge_total}`,
				desc: `${formatPercent(this.data.memory.unstable_edge_ratio)} unstable ratio`
			},
			{
				key: 'stability',
				title: 'Average stability',
				value: String(this.data.memory.avg_edge_stability),
				desc: `Average rewire score ${this.data.memory.avg_edge_rewire_score}`
			}
		]
	}

	get activity_window_items(): Array<HomeModelItem> {
		if (!this.data) {
			return []
		}

		return [
			{
				key: 'today',
				title: 'Today',
				value: `${this.data.activity.today.messages} messages`,
				desc: `${this.data.activity.today.sessions} sessions · ${this.data.activity.today.posts} posts · ${formatCompact(this.data.activity.today.tokens)} tokens`
			},
			{
				key: 'week',
				title: 'This week',
				value: `${this.data.activity.week.messages} messages`,
				desc: `${this.data.activity.week.sessions} sessions · ${this.data.activity.week.posts} posts · ${formatCompact(this.data.activity.week.tokens)} tokens`
			}
		]
	}

	get pthink_alert_label() {
		if (!this.data?.health.top_alert) {
			return this.data?.health.has_meaningful_recent_activity
				? 'Meaningful activity detected'
				: 'No alert signal'
		}

		return `${this.data.health.top_alert.label} · ${this.data.health.top_alert.detail}`
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
				value: this.pthink_config?.trigger_enabled
					? `enabled · ${this.data.health.top_alert?.label ?? 'no active alert'}`
					: 'disabled'
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

import { Loader2 } from 'lucide-react'
import { observer } from 'mobx-react-lite'

import { MessageResponse } from '@/__shadcn__/components/ai-elements/message'
import { formatDateTime } from '@/utils'

import { useModel } from '../context'

const stat_item_class = 'flex flex-col gap-2 px-4 py-3.5'

const Index = () => {
	const x = useModel()
	const pthink_runtime_items = x.pthink_runtime_items
	const pthink_depth_items = x.pthink_depth_items
	const current_report = x.current_report_record
	const current_report_title = x.report_article?.title || current_report?.title || 'Untitled report'
	const current_report_summary = current_report?.summary || ''
	const current_report_kind = current_report
		? `${current_report.kind[0]?.toUpperCase() ?? ''}${current_report.kind.slice(1)} report`
		: ''

	return (
		<div className='flex flex-col gap-3'>
			<div
				className='
					flex
					items-center
					pl-2
					text-std-600 text-sm font-semibold leading-none
					border-l-2 border-std-500
				'
			>
				Report
			</div>
			<div className='text-std-400 text-sm leading-6'>
				Autonomous reporting status, schedule pressure, and runtime health.
			</div>
			<div className='flex flex-col'>
				<div className='border-border-light border px-4 py-3.5'>
					<div className='text-std-400 text-xs font-medium uppercase'>Selected Report</div>
					<div className='mt-2 text-sm font-medium'>{x.report_window_label}</div>
					{current_report ? (
						<div className='mt-3 flex flex-col gap-3'>
							<div className='flex flex-col gap-1'>
								<div className='text-base font-medium'>{current_report_title}</div>
								<div className='text-std-400 text-xs uppercase'>
									{current_report_kind} ·{' '}
									{formatDateTime(current_report.created_at, 'YYYY-MM-DD HH:mm')}
								</div>
							</div>
							{current_report_summary ? (
								<div className='text-std-400 text-sm leading-6'>
									{current_report_summary}
								</div>
							) : null}
							{x.report_article_loading ? (
								<div
									className='
										flex
										items-center
										gap-2
										text-sm text-std-400
									'
								>
									<Loader2 className='size-4 animate-spin'></Loader2>
									Loading report content...
								</div>
							) : x.report_article_error ? (
								<div className='text-std-400 text-sm'>{x.report_article_error}</div>
							) : x.report_article?.content ? (
								<div className='pt-1' data-streamdown>
									<MessageResponse className='w-full leading-7'>
										{x.report_article.content}
									</MessageResponse>
								</div>
							) : (
								<div className='text-std-400 text-sm'>Report content unavailable.</div>
							)}
						</div>
					) : (
						<div className='text-std-400 mt-2 text-sm leading-6'>
							No report generated for {x.report_window_label.toLowerCase()}.
						</div>
					)}
				</div>
				<div className='border-border-light border px-4 py-3.5'>
					<div className='text-sm font-medium'>
						{x.pthink_enabled
							? 'Autonomous Reporting Enabled'
							: 'Autonomous Reporting Disabled'}
					</div>
					<div className='text-std-400 mt-2 text-sm leading-6'>
						Idle trigger after {x.pthink_idle_mins} minutes. Daily report{' '}
						{x.pthink_config?.daily_report_enabled
							? `on at ${x.pthink_config?.daily_report_hour ?? 21}:00`
							: 'off'}
						. Weekly report{' '}
						{x.pthink_config?.weekly_report_enabled
							? `on ${x.pthink_weekly_day} ${x.pthink_config?.weekly_report_hour ?? 20}:00`
							: 'off'}
						.
					</div>
					<div className='text-std-400 mt-2 text-sm leading-6'>{x.pthink_runtime_label}</div>
				</div>
				<div
					className='
						px-4 py-3.5
						border border-border-light border-t-0
					'
				>
					<div className='text-std-400 text-xs font-medium uppercase'>Top Signal</div>
					<div className='mt-2 text-sm leading-6'>{x.pthink_alert_label}</div>
				</div>

				<div
					className='
						px-4 py-3.5
						border border-border-light border-t-0
					'
				>
					<div className='text-std-400 text-xs font-medium uppercase'>Runtime and Config</div>
				</div>
				<div
					className='
						grid
						border border-border-light border-t-0
						md:grid-cols-2
					'
				>
					{pthink_runtime_items.map((item, index) => (
						<div
							className={$cx(
								stat_item_class,
								`
								border-border-light border-r border-b
								last:border-b-0 even:border-r-0
							`
							)}
							key={item.key}
						>
							<div className='text-std-400 text-xs font-medium uppercase'>{item.title}</div>
							<div className='text-sm leading-6'>{item.value}</div>
						</div>
					))}
				</div>
				<div
					className='
						grid
						border border-border-light border-t-0
						md:grid-cols-3
					'
				>
					{pthink_depth_items.map((item, index) => (
						<div
							className={$cx(
								stat_item_class,
								'border-border-light border-b md:border-b-0',
								index < pthink_depth_items.length - 1 && 'md:border-r'
							)}
							key={item.key}
						>
							<div className='text-std-400 text-xs font-medium uppercase'>{item.title}</div>
							<div className='font-mono text-2xl font-semibold tracking-tight'>
								{item.value}
							</div>
							{item.desc ? <div className='text-std-300 text-xs'>{item.desc}</div> : null}
						</div>
					))}
				</div>
			</div>
		</div>
	)
}

export default observer(Index)

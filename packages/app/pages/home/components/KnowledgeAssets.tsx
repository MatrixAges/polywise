import { RefreshCw } from 'lucide-react'
import { observer } from 'mobx-react-lite'

import { useModel } from '../context'
import SectionCard from './SectionCard'

const metric_card_class = 'rounded-2xl border border-border/70 p-4'
const list_panel_class = 'rounded-2xl border border-border/70 p-4'

const Index = () => {
	const x = useModel()

	return (
		<SectionCard
			title='Assets'
			desc='Usage, content accumulation, ingestion pressure, and model attribution without falling back to oversized containers.'
			action={
				<button
					className='click_button'
					type='button'
					onClick={() => void x.refresh()}
					disabled={x.loading}
				>
					<RefreshCw className={x.loading ? 'animate-spin' : ''} />
					<span>{x.loading ? 'Refreshing' : 'Refresh'}</span>
				</button>
			}
		>
			<div className='grid gap-6'>
				<div className='grid grid-cols-2 gap-3 md:grid-cols-4'>
					{x.usage_metrics.map(item => (
						<div className={metric_card_class} key={item.key}>
							<div className='text-std-400 text-[11px] tracking-[0.18em] uppercase'>
								{item.title}
							</div>
							<div className='mt-2 text-2xl font-semibold tracking-tight'>{item.value}</div>
						</div>
					))}
				</div>

				<div className='grid grid-cols-2 gap-3 md:grid-cols-4'>
					<div className={metric_card_class}>
						<div className='text-std-400 text-[11px] tracking-[0.18em] uppercase'>Posts</div>
						<div className='mt-2 text-2xl font-semibold tracking-tight'>{x.posts_total}</div>
						<div className='text-std-400 mt-2 text-sm leading-5'>{x.posts_meta}</div>
						<div className='text-std-400 mt-1 text-sm leading-5'>{x.posts_pipeline_meta}</div>
					</div>
					<div className={metric_card_class}>
						<div className='text-std-400 text-[11px] tracking-[0.18em] uppercase'>Pipeline</div>
						<div className='mt-2 text-2xl font-semibold tracking-tight'>{x.pipeline_total}</div>
						<div className='text-std-400 mt-2 text-sm leading-5'>{x.pipeline_meta}</div>
						<div className='text-std-400 mt-1 text-sm leading-5'>{x.pipeline_detail}</div>
					</div>
					<div className={metric_card_class}>
						<div className='text-std-400 text-[11px] tracking-[0.18em] uppercase'>Links</div>
						<div className='mt-2 text-2xl font-semibold tracking-tight'>{x.linkcase_total}</div>
						<div className='text-std-400 mt-2 text-sm leading-5'>{x.linkcase_meta}</div>
					</div>
					<div className={metric_card_class}>
						<div className='text-std-400 text-[11px] tracking-[0.18em] uppercase'>
							Footprint
						</div>
						<div className='mt-2 text-2xl font-semibold tracking-tight'>
							{x.system_footprint_total}
						</div>
						<div className='text-std-400 mt-2 text-sm leading-5'>{x.system_footprint_meta}</div>
						<div className='text-std-400 mt-1 text-sm leading-5'>
							{x.system_footprint_detail}
						</div>
					</div>
				</div>

				<div className='grid gap-3 md:grid-cols-3'>
					{x.asset_health_items.map(item => (
						<div className={metric_card_class} key={item.key}>
							<div className='text-std-400 text-[11px] tracking-[0.18em] uppercase'>
								{item.title}
							</div>
							<div className='mt-2 text-xl font-semibold tracking-tight'>{item.value}</div>
							{item.desc ? (
								<div className='text-std-400 mt-2 text-sm leading-5'>{item.desc}</div>
							) : null}
						</div>
					))}
				</div>

				<div className='grid gap-3 md:grid-cols-4'>
					{x.usage_depth_items.map(item => (
						<div className={metric_card_class} key={item.key}>
							<div className='text-std-400 text-[11px] tracking-[0.18em] uppercase'>
								{item.title}
							</div>
							<div className='mt-2 text-xl font-semibold tracking-tight'>{item.value}</div>
							{item.desc ? (
								<div className='text-std-400 mt-2 text-sm leading-5'>{item.desc}</div>
							) : null}
						</div>
					))}
				</div>

				<div className='grid gap-3 md:grid-cols-3'>
					{x.asset_depth_items.map(item => (
						<div className={metric_card_class} key={item.key}>
							<div className='text-std-400 text-[11px] tracking-[0.18em] uppercase'>
								{item.title}
							</div>
							<div className='mt-2 text-xl font-semibold tracking-tight'>{item.value}</div>
							{item.desc ? (
								<div className='text-std-400 mt-2 text-sm leading-5'>{item.desc}</div>
							) : null}
						</div>
					))}
				</div>

				<div className='grid gap-3 md:grid-cols-2'>
					<div className={list_panel_class}>
						<div className='text-std-400 text-[11px] tracking-[0.18em] uppercase'>
							Top models
						</div>
						<div className='divide-border/60 mt-3 divide-y'>
							{x.top_models.map(item => (
								<div
									className='
										flex
										items-start justify-between
										gap-3
										py-3
										first:pt-0 last:pb-0
									'
									key={item.key}
								>
									<div className='min-w-0'>
										<div className='truncate text-sm font-medium'>
											{item.title}
										</div>
										<div className='text-std-400 truncate text-xs'>
											{item.subtitle}
										</div>
									</div>
									<div className='text-right'>
										<div className='text-sm font-semibold'>{item.value}</div>
										<div className='text-std-400 text-xs'>{item.meta}</div>
									</div>
								</div>
							))}
						</div>
					</div>

					<div className={list_panel_class}>
						<div className='text-std-400 text-[11px] tracking-[0.18em] uppercase'>
							Providers
						</div>
						<div className='divide-border/60 mt-3 divide-y'>
							{x.top_providers.map(item => (
								<div
									className='
										flex
										items-start justify-between
										gap-3
										py-3
										first:pt-0 last:pb-0
									'
									key={item.key}
								>
									<div>
										<div className='text-sm font-medium'>{item.title}</div>
										<div className='text-std-400 text-xs'>{item.subtitle}</div>
									</div>
									<div className='text-right text-sm font-semibold'>
										{item.value}
									</div>
								</div>
							))}
						</div>
						<div className='text-std-400 mt-3 text-xs leading-5'>{x.usage_footer}</div>
					</div>
				</div>
			</div>
		</SectionCard>
	)
}

export default observer(Index)

import { RefreshCw } from 'lucide-react'
import { observer } from 'mobx-react-lite'

import { useModel } from '../context'
import SectionCard from './SectionCard'

const panel_class = 'bg-secondary/60 rounded-3xl p-4'

const Index = () => {
	const x = useModel()

	return (
		<SectionCard
			title='AI Usage and Knowledge Assets'
			desc='token 使用、模型归因、内容资产和处理状态。'
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
			<div className='grid gap-3 xl:grid-cols-2'>
				<div className='bg-secondary/60 rounded-3xl p-4 xl:col-span-2'>
					<div className='text-std-400 text-xs tracking-[0.18em] uppercase'>AI Usage</div>
					<div className='mt-3 grid gap-3 md:grid-cols-4'>
						{x.usage_metrics.map(item => (
							<div className='bg-background/80 rounded-2xl p-3' key={item.key}>
								<div className='text-std-400 text-xs tracking-[0.16em] uppercase'>
									{item.title}
								</div>
								<div className='mt-2 text-2xl font-semibold'>{item.value}</div>
							</div>
						))}
					</div>
					<div className='mt-3 grid gap-3 lg:grid-cols-[1.1fr_0.9fr]'>
						<div className='bg-background/80 rounded-2xl p-3'>
							<div
								className='
									mb-2
									text-std-400 text-xs tracking-[0.16em]
									uppercase
								'
							>
								Top Models
							</div>
							<div className='flex flex-col gap-2'>
								{x.top_models.map(item => (
									<div
										className='
											flex
											items-center justify-between
											gap-3
											px-3 py-2
											rounded-2xl
											border border-border/60
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
											<div className='text-sm font-semibold'>
												{item.value}
											</div>
											<div className='text-std-400 text-xs'>
												{item.meta}
											</div>
										</div>
									</div>
								))}
							</div>
						</div>

						<div className='bg-background/80 rounded-2xl p-3'>
							<div
								className='
									mb-2
									text-std-400 text-xs tracking-[0.16em]
									uppercase
								'
							>
								Providers
							</div>
							<div className='flex flex-col gap-2'>
								{x.top_providers.map(item => (
									<div
										className='
											flex
											items-center justify-between
											gap-3
											px-3 py-2
											rounded-2xl
											border border-border/60
										'
										key={item.key}
									>
										<div>
											<div className='text-sm font-medium'>
												{item.title}
											</div>
											<div className='text-std-400 text-xs'>
												{item.subtitle}
											</div>
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

				<div className={panel_class}>
					<div className='text-std-400 text-xs tracking-[0.18em] uppercase'>Posts</div>
					<div className='mt-3 text-2xl font-semibold'>{x.posts_total}</div>
					<div className='text-std-400 mt-2 text-sm'>{x.posts_meta}</div>
					<div className='text-std-400 mt-2 text-sm'>{x.posts_pipeline_meta}</div>
				</div>

				<div className={panel_class}>
					<div className='text-std-400 text-xs tracking-[0.18em] uppercase'>Pipeline</div>
					<div className='mt-3 text-2xl font-semibold'>{x.pipeline_total}</div>
					<div className='text-std-400 mt-2 text-sm'>{x.pipeline_meta}</div>
					<div className='text-std-400 mt-2 text-sm'>{x.pipeline_detail}</div>
				</div>

				<div className={panel_class}>
					<div className='text-std-400 text-xs tracking-[0.18em] uppercase'>Linkcase</div>
					<div className='mt-3 text-2xl font-semibold'>{x.linkcase_total}</div>
					<div className='text-std-400 mt-2 text-sm'>{x.linkcase_meta}</div>
				</div>

				<div className={panel_class}>
					<div className='text-std-400 text-xs tracking-[0.18em] uppercase'>System Footprint</div>
					<div className='mt-3 text-2xl font-semibold'>{x.system_footprint_total}</div>
					<div className='text-std-400 mt-2 text-sm'>{x.system_footprint_meta}</div>
					<div className='text-std-400 mt-2 text-sm'>{x.system_footprint_detail}</div>
				</div>
			</div>
		</SectionCard>
	)
}

export default observer(Index)

import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'

import { useModel } from '../context'

const Index = () => {
	const x = useModel()
	const { t } = useTranslation('home')

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
				{t('sections.token_usage')}
			</div>
			<div className='flex flex-col'>
				<div className='border-border-light grid grid-cols-4 border'>
					{x.usage_metrics.map(item => (
						<div
							className='
								flex flex-col
								gap-2
								px-4 py-3.5
								border-border-light border-r
								last:border-r-0
							'
							key={item.key}
						>
							<div className='text-std-400 text-xs font-medium uppercase'>{item.title}</div>
							<div className='font-mono text-2xl font-semibold tracking-tight'>
								{item.value}
							</div>
						</div>
					))}
				</div>
				<div
					className='
						grid grid-cols-2
						border border-border-light border-y-0
					'
				>
					{x.usage_depth_items.map(item => (
						<div
							className='
								flex flex-col
								gap-2
								px-4 py-3.5
								border-r border-border-light border-b
								even:border-r-0
							'
							key={item.key}
						>
							<div className='text-std-400 text-xs font-medium uppercase'>{item.title}</div>
							<div className='font-mono text-2xl font-semibold tracking-tight'>
								{item.value}
							</div>
							<div className='text-std-300 text-xs'>{item.desc}</div>
						</div>
					))}
				</div>
				<div
					className='
						flex flex-col
						gap-2
						px-4 py-3.5
						border border-border-light border-t-0
					'
				>
					<div className='text-std-400 text-xs font-medium uppercase'>{t('common.top_models')}</div>
					<div className='gap-1.5'>
						{x.top_models.map(item => (
							<div
								className='
									flex
									items-start justify-between
									gap-3
								'
								key={item.key}
							>
								<div className='flex flex-col gap-0.5'>
									<div className='truncate text-sm font-medium'>{item.title}</div>
									<div className='text-std-300 truncate text-xs'>
										{item.subtitle}
									</div>
								</div>
								<div className='text-right'>
									<div className='font-mono text-sm font-semibold'>
										{item.value}
									</div>
									<div className='text-std-300 text-xs'>{item.meta}</div>
								</div>
							</div>
						))}
					</div>
				</div>
				<div
					className='
						flex flex-col
						gap-2
						px-4 py-3.5
						border border-border-light border-t-0
					'
				>
					<div className='text-std-400 text-xs font-medium uppercase'>{t('common.providers')}</div>
					<div className='gap-1.5 font-mono'>
						{x.top_providers.map(item => (
							<div
								className='
									flex
									items-center justify-between
									gap-3
								'
								key={item.key}
							>
								<div className='flex flex-col gap-0.5'>
									<div className='text-sm font-medium'>{item.title}</div>
									<div className='text-std-300 text-xs'>{item.subtitle}</div>
								</div>
								<div className='text-right font-mono text-sm font-semibold'>
									{item.value}
								</div>
							</div>
						))}
					</div>
				</div>
			</div>
		</div>
	)
}

export default observer(Index)

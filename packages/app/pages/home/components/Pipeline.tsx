import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'

import { useModel } from '../context'

const Index = () => {
	const x = useModel()
	const { t } = useTranslation('home')

	if (!x.data) return

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
				{t('sections.pipeline_ready')}
			</div>
			<div className='flex flex-col'>
				<div className='border-border-light grid grid-cols-5 border'>
					<div
						className='
							flex flex-col
							gap-2
							px-4 py-3.5
							border-r border-border-light
						'
					>
						<div className='text-std-400 text-xs font-medium uppercase'>
							{t('common.total')}
						</div>
						<div className='font-mono text-2xl font-semibold tracking-tight'>
							{x.pipeline_total}
						</div>
					</div>
					<div
						className='
							flex flex-col
							gap-2
							px-4 py-3.5
							border-r border-border-light
						'
					>
						<div className='text-std-400 text-xs font-medium uppercase'>
							{t('common.documents')}
						</div>
						<div className='font-mono text-2xl font-semibold tracking-tight'>
							{x.data.content.documents_pending}
						</div>
					</div>
					<div
						className='
							flex flex-col
							gap-2
							px-4 py-3.5
							border-r border-border-light
						'
					>
						<div className='text-std-400 text-xs font-medium uppercase'>
							{t('common.articles')}
						</div>
						<div className='font-mono text-2xl font-semibold tracking-tight'>
							{x.data.content.articles_pending}
						</div>
					</div>
					<div
						className='
							flex flex-col
							gap-2
							px-4 py-3.5
							border-r border-border-light
						'
					>
						<div className='text-std-400 text-xs font-medium uppercase'>
							{t('common.links')}
						</div>
						<div className='font-mono text-2xl font-semibold tracking-tight'>
							{x.data.content.link_pending_total}
						</div>
					</div>
					<div
						className='
							flex flex-col
							gap-2
							px-4 py-3.5
						'
					>
						<div className='text-std-400 text-xs font-medium uppercase'>
							{t('common.posts')}
						</div>
						<div className='font-mono text-2xl font-semibold tracking-tight'>
							{x.data.content.posts_pending}
						</div>
					</div>
				</div>
				<div
					className='
						grid grid-cols-2
						border border-border-light border-t-0
					'
				>
					{x.asset_health_items.map(item => (
						<div
							className='
								flex flex-col
								gap-2
								px-4 py-3.5
								border-r border-border-light
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
			</div>
		</div>
	)
}

export default observer(Index)

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
				{t('sections.session_activity')}
			</div>
			<div
				className='
					grid grid-cols-2
					border border-border-light border-b-0
				'
			>
				{x.asset_depth_items.map(item => (
					<div
						className='
							flex flex-col
							gap-2
							px-4 py-3.5
							border-border-light border-r border-b
							last:border-r-0
						'
						key={item.key}
					>
						<div className='text-std-400 text-xs font-medium uppercase'>{item.title}</div>
						<div className='font-mono text-2xl font-semibold tracking-tight'>{item.value}</div>
						<div className='text-std-300 text-xs'>{item.desc}</div>
					</div>
				))}
			</div>
		</div>
	)
}

export default observer(Index)

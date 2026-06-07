import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'

import { useModel } from '../context'

const Index = () => {
	const x = useModel()
	const { t } = useTranslation('post')

	if (x.outline_items.length === 0) {
		return <div className='text-std-400 px-3 py-4 text-sm'>{t('detail.no_headings')}</div>
	}

	return (
		<div
			className='
				box-border
				flex flex-col
				w-full
				pb-3
			'
		>
			{x.outline_items.map(item => (
				<button
					className='
						box-border
						flex
						items-center
						w-full
						gap-2
						p-1
						text-xsm text-std-600
						hover:text-std-black
						cursor-pointer
					'
					onClick={() => x.scrollToOutlineItem(item)}
					key={item.id}
				>
					<span
						className='
							flex shrink-0
							items-center justify-end
							w-[12px]
						'
					>
						<span
							className='bg-std-200 h-[3px] rounded-full'
							style={{ width: (6 - item.level) * 2.4 }}
						></span>
					</span>
					<span className='truncate'>{item.text}</span>
				</button>
			))}
		</div>
	)
}

export default observer(Index)

import { Globe } from 'lucide-react'
import { observer } from 'mobx-react-lite'

import { useModel } from '../context'
import { getLinkFaviconSrc } from '../types'

import type { LinkcaseItem } from '../types'

const status_style_map = {
	none: 'bg-std-200/60 text-std-500',
	pending: 'bg-amber-100 text-amber-700',
	success: 'bg-emerald-100 text-emerald-700',
	fail: 'bg-rose-100 text-rose-700',
	timeout: 'bg-orange-100 text-orange-700',
	ignore: 'bg-slate-100 text-slate-600'
} as const

interface IProps {
	item: LinkcaseItem
	index: number
}

const Index = ({ item, index }: IProps) => {
	const x = useModel()
	const favicon_src = getLinkFaviconSrc(item.favicon)
	const selected = x.selected_id === item.id

	return (
		<div
			className={$cx(
				`
				flex
				items-center
				gap-1.5
				p-1.5
				rounded-none
				border border-transparent
				group
				click_button
			`,
				selected && 'active bg-secondary/60'
			)}
			data-index={index}
			onClick={() => x.selectLink(item.id)}
			key={item.id}
		>
			{x.select_mode && (
				<div
					className='
						flex shrink-0
						items-center justify-center
					'
					onClick={event => event.stopPropagation()}
				>
					<input
						className='accent-primary size-3 cursor-pointer'
						type='checkbox'
						checked={x.isLinkChecked(item.id)}
						onChange={event => x.toggleLinkChecked(item.id, event.currentTarget.checked)}
					/>
				</div>
			)}
			<div
				className='
					overflow-hidden
					flex shrink-0
					items-center justify-center
					size-7
					p-1.5
					rounded-full
					text-std-400/60
					bg-secondary
				'
			>
				{favicon_src ? (
					<img className='size-full object-cover' src={favicon_src} alt={item.title} />
				) : (
					<Globe className='size-full'></Globe>
				)}
			</div>
			<div
				className='
					flex flex-1 flex-col
					min-w-0
				'
			>
				<div className='text-std-500 text-xsm truncate font-medium'>{item.title || item.url}</div>
				<div className='text-std-400/60 truncate text-xs'>{item.url}</div>
			</div>
			{item.status !== 'none' && (
				<div
					className={$cx(
						`
						shrink-0
						px-1.5 py-0.5
						rounded-full
						text-xs
					`,
						status_style_map[item.status]
					)}
				>
					{item.status}
				</div>
			)}
		</div>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()

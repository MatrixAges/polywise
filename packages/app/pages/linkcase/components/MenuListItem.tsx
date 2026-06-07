import { CircleCheck, CircleDashed, CircleSlash, CircleX, Clock3, Globe, LoaderCircle } from 'lucide-react'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'

import { Tooltip } from '@/components'

import { useModel } from '../context'
import { getLinkFaviconSrc } from '../types'

import type { LucideIcon } from 'lucide-react'
import type { MouseEvent } from 'react'
import type { LinkcaseItem } from '../types'

const status_icon_map = {
	none: {
		Icon: CircleDashed,
		color: 'text-std-400/70'
	},
	pending: {
		Icon: LoaderCircle,
		color: 'text-amber-600',
		className: 'animate-spin'
	},
	success: {
		Icon: CircleCheck,
		color: 'text-emerald-600'
	},
	fail: {
		Icon: CircleX,
		color: 'text-rose-600'
	},
	timeout: {
		Icon: Clock3,
		color: 'text-orange-600'
	},
	ignore: {
		Icon: CircleSlash,
		color: 'text-slate-500'
	}
} as Record<string, { Icon: LucideIcon; color: string; className?: string }>

interface IProps {
	item: LinkcaseItem
	index: number
}

const Index = ({ item, index }: IProps) => {
	const x = useModel()
	const { t } = useTranslation('linkcase')
	const favicon_src = getLinkFaviconSrc(item.favicon)
	const selected = x.selected_id === item.id
	const status_icon = status_icon_map[item.status]

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
				selected && 'active bg-secondary'
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
					onClick={(event: MouseEvent<HTMLDivElement>) => event.stopPropagation()}
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
			{item.status !== 'none' && status_icon && (
				<Tooltip title={t(`status.${item.status}`)}>
					<div
						className='
							flex shrink-0
							items-center justify-center
							size-5
							rounded-full
						'
					>
						<status_icon.Icon
							className={$cx('size-3.5', status_icon.color, status_icon.className)}
						></status_icon.Icon>
					</div>
				</Tooltip>
			)}
		</div>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()

import { Bot, Clipboard, PanelRightClose, Search } from 'lucide-react'

import { memo } from '@/utils'

import type { IPropsPanel } from '../../types'

const Index = (props: IPropsPanel) => {
	const {} = props

	return (
		<div
			className='
				flex flex-col
				w-[320px] h-full
			'
		>
			<div
				className='
					flex
					items-center justify-between
					h-[41px]
					border-b border-l border-std-900/8
					is_drag
				'
			>
				<div
					className='
						flex
						h-full
						no_drag
					'
				>
					<div
						className='
							flex
							items-center justify-center
							w-[41px] h-full
							bg-std-100
							border-r border-std-900/8
							shadow-[0_1px_0_0_var(--color-std-100)]
							clickable
						'
					>
						<Bot size={18} />
					</div>
					<div
						className='
							flex
							items-center justify-center
							w-[41px] h-full
							border-r border-std-900/8
							clickable
						'
					>
						<Clipboard size={16} />
					</div>
					<div
						className='
							flex
							items-center justify-center
							w-[41px] h-full
							border-r border-std-900/8
							clickable
						'
					>
						<Search size={16} />
					</div>
				</div>
				<div
					className='
						flex
						items-center justify-center
						w-[40px] h-full
						clickable
					'
				>
					<PanelRightClose size={16} />
				</div>
			</div>
			<div
				className='
					flex flex-1
					bg-std-100
					border-l border-std-900/8
				'
			></div>
		</div>
	)
}

export default memo(Index)

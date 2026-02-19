import { Bot, Clipboard, PanelRightClose, Search } from 'lucide-react'

import { memo } from '@/utils'

import type { IPropsPanel } from '../../types'

const Index = (props: IPropsPanel) => {
	const { onClose } = props

	return (
		<div className='flex h-full w-full flex-col'>
			<div className='border-std-900/8 is_drag flex h-[36px] items-center justify-between border-b border-l'>
				<div className='no_drag flex h-full'>
					<div className='bg-std-100 border-std-900/8 clickable flex h-full w-[37px] items-center justify-center border-r shadow-[0_1px_0_0_var(--color-std-100)]'>
						<Bot size={18} />
					</div>
					<div className='border-std-900/8 clickable flex h-full w-[37px] items-center justify-center border-r'>
						<Clipboard size={16} />
					</div>
					<div className='border-std-900/8 clickable flex h-full w-[37px] items-center justify-center border-r'>
						<Search size={16} />
					</div>
				</div>
				<div className='clickable flex h-full w-[37px] items-center justify-center' onClick={onClose}>
					<PanelRightClose size={16} />
				</div>
			</div>
			<div className='bg-std-100 border-std-900/8 flex flex-1 border-l'></div>
		</div>
	)
}

export default memo(Index)

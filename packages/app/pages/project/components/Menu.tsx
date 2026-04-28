import { Plus } from 'lucide-react'

import { Tooltip } from '@/components'

import MenuItem from './MenuItem'

import type { IPropsMenu } from '../types'

const Index = (props: IPropsMenu) => {
	const { projects } = props

	return (
		<div
			className='
				overflow-y-hidden
				flex-col
				w-[210px] h-full
				border-border-light border-r
			'
		>
			<div
				className='
					flex
					items-center justify-between
					px-3 py-1.5
				'
			>
				<span
					className='
						px-1 py-0.5
						text-xsm text-std-500 font-medium
					'
				>
					Projects
				</span>
				<div className='flex gap-1'>
					<Tooltip title='New Session'>
						<div className='icon_button small'>
							<Plus></Plus>
						</div>
					</Tooltip>
				</div>
			</div>
			<div className='flex min-h-0 flex-1 overflow-y-scroll'>
				<div className='flex w-full flex-col px-1.5'>
					{projects.map((item, index) => (
						<MenuItem item={item} index={index} key={item.project.id}></MenuItem>
					))}
				</div>
			</div>
		</div>
	)
}

export default $app.memo(Index)

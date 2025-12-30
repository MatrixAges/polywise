import { Form } from 'antd'

import type { LucideIcon } from 'lucide-react'
import type { PropsWithChildren, ReactNode } from 'react'

interface IProps extends PropsWithChildren {
	Icon: LucideIcon
	title: ReactNode
	name?: string
	desc?: ReactNode
	extra?: ReactNode
	pure?: boolean
}

const { Item } = Form

const Index = (props: IProps) => {
	const { children, Icon, title, name, desc, extra, pure } = props

	return (
		<div
			className='
				flex
				items-center justify-between
				w-full
				min-h-10
				gap-3
			'
		>
			<div className='flex items-center'>
				<div
					className='
						flex shrink-0
						items-center justify-center
						w-[21px] h-[21px]
						mr-4
						text-[21px]
					'
				>
					<Icon />
				</div>
				<div className='flex flex-col'>
					<span className='leading-none font-medium'>{title}</span>
					{desc && <span className='text-gray mt-1 text-xs'>{desc}</span>}
				</div>
			</div>
			<div className='flex items-center gap-3'>
				{extra}
				{pure ? (
					children
				) : (
					<Item name={name} noStyle>
						{children}
					</Item>
				)}
			</div>
		</div>
	)
}

export default $app.memo(Index)

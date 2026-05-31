import { $ } from '@website/utils'

import type { ReactNode } from 'react'

interface IProps {
	title: string
	children?: ReactNode
	step?: number
	is_last?: boolean
}

const Index = (props: IProps) => {
	const { title, children, step, is_last } = props
	const body_padding_class = is_last ? 'pb-0' : 'pb-10'

	return (
		<section className='grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 md:gap-x-6'>
			<div className='flex w-12 flex-col items-center'>
				<div
					className='
						flex
						items-center justify-center
						size-8
						rounded-full
						text-base font-semibold
						bg-(--color_bg_2)
					'
				>
					{step}
				</div>
				{!is_last && (
					<div
						className='
							flex-1
							w-px
							min-h-14
							bg-(--color_border_light)
						'
					></div>
				)}
			</div>
			<div className={$.cx('min-w-0 pt-0.5', body_padding_class)}>
				<div
					className='
						text-pretty text-xl font-semibold tracking-tight
					'
				>
					{title}
				</div>
				<div
					className='
						mt-4
						text-[15px] leading-8
						[&>*:first-child]:mt-0! [&>*:last-child]:mb-0! [&_a]:underline [&_a]:underline-offset-4 [&_ol]:my-4 [&_ol]:pl-5 [&_p]:px-0! [&_pre]:my-5 [&_ul]:my-4 [&_ul]:pl-5
					'
				>
					{children}
				</div>
			</div>
		</section>
	)
}

export default $.memo(Index)

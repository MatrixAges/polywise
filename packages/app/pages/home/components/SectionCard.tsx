import type { ReactNode } from 'react'

const Index = (props: { title: string; desc: string; action?: ReactNode; children: ReactNode }) => {
	const { title, desc, action, children } = props

	return (
		<section
			className='
				p-5
				rounded-[28px]
				bg-background/80
				border border-border/70
				shadow-sm
				backdrop-blur-sm
			'
		>
			<div
				className='
					flex flex-wrap
					items-start justify-between
					gap-3
				'
			>
				<div>
					<div className='text-base font-semibold'>{title}</div>
					<div className='text-std-400 mt-1 text-sm'>{desc}</div>
				</div>
				{action}
			</div>
			<div className='mt-5'>{children}</div>
		</section>
	)
}

export default Index

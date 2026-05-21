import type { ReactNode } from 'react'

const Index = (props: { title: string; desc: string; action?: ReactNode; children: ReactNode }) => {
	const { title, desc, action, children } = props

	return (
		<section className='flex flex-col gap-4'>
			<div
				className='
					flex flex-wrap
					items-start justify-between
					gap-4
				'
			>
				<div className='min-w-0'>
					<div className='text-xl font-semibold tracking-tight'>{title}</div>
					<div
						className='
							max-w-[42rem]
							mt-1
							text-std-400 text-sm leading-6
						'
					>
						{desc}
					</div>
				</div>
				{action}
			</div>
			<div className='border-border/70 border-t pt-4'>{children}</div>
		</section>
	)
}

export default Index

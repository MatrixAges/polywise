import type { PropsWithChildren } from 'react'

const Index = ({ children }: PropsWithChildren) => {
	return (
		<div
			className='
				flex flex-1
				h-full
				p-2 pt-0
			'
		>
			<div
				className='
					overflow-y-scroll
					w-full h-full
					rounded-xl
					bg-dev/24
					border border-dev
				'
			>
				<div className='w-full'>{children}</div>
			</div>
		</div>
	)
}

export default $app.memo(Index)

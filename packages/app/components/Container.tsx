import type { PropsWithChildren } from 'react'

const Index = ({ children }: PropsWithChildren) => {
	return (
		<div
			className='
				overflow-x-hidden
				flex flex-1
				h-full
				p-2 pt-0
			'
		>
			<div
				className='
					overflow-y-hidden
					w-full h-full
					rounded-2xl
					bg-dev/24
					border border-dev
				'
			>
				<div className='h-full w-full'>{children}</div>
			</div>
		</div>
	)
}

export default $app.memo(Index)

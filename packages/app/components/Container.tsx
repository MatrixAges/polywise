import type { PropsWithChildren } from 'react'

const Index = ({ children }: PropsWithChildren) => {
	return (
		<div
			className='
				overflow-x-hidden
				flex flex-1
				h-full
				px-2.5
			'
		>
			<div
				className='
					overflow-y-hidden
					w-full h-full
				'
			>
				<div className='h-full w-full'>{children}</div>
			</div>
		</div>
	)
}

export default $app.memo(Index)

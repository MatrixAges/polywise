import type { PropsWithChildren } from 'react'

const Index = ({ children }: PropsWithChildren) => {
	return (
		<div
			className='
				relative
				overflow-hidden
				flex flex-1
				h-full
			'
		>
			<div
				className='
					absolute
					inset-0
					overflow-x-hidden overflow-y-hidden
					w-full h-full
					px-2.5
					[overflow-anchor:none]
				'
			>
				<div className='h-full w-full'>{children}</div>
			</div>
		</div>
	)
}

export default $app.memo(Index)

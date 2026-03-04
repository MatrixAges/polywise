import { memo } from '@/utils'

import type { PropsWithChildren } from 'react'

interface IProps extends PropsWithChildren {
	label: string
	valued: boolean | string | number | undefined | null
	className?: string
}

const Index = (props: IProps) => {
	const { className, children, label, valued } = props
	const value = Boolean(valued)

	return (
		<div
			className={`
				relative
				w-full h-14
				text-xsm
				border-b border-border-gray
				transition-[border]
				group
				focus-within:border-b-border-solid-active
				${value && 'justify-start'} ${className}
`}
		>
			<label
				className={`
					absolute
					top-2
					left-0
					flex
					items-center
					h-4
					px-3
					text-gray
					transition-[top]
					group-focus-within:text-[10px]
					capitalize
					${value ? 'text-[10px]' : 'group-not-focus-within:top-5'}
`}
			>
				{label}
			</label>
			<div
				className={`
					absolute
					left-0
					flex
					w-full h-full
					px-3 pt-4
					text-solid
					transition-opacity
					${!value && 'group-not-focus-within:opacity-0'}
`}
			>
				{children}
			</div>
		</div>
	)
}

export default memo(Index)

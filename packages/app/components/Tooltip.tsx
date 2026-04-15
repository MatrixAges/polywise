import { Tooltip, TooltipContent, TooltipTrigger } from '@/__shadcn__/components/ui/tooltip'

import type { PropsWithChildren } from 'react'

interface IProps extends PropsWithChildren {
	title: string
	className?: string
}

const Index = (props: IProps) => {
	const { children, title, className } = props

	return (
		<Tooltip>
			<TooltipTrigger className={className}>{children}</TooltipTrigger>
			<TooltipContent>{title}</TooltipContent>
		</Tooltip>
	)
}

export default $app.memo(Index)

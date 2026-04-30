import { Badge } from '@/__shadcn__/components/ui/badge'

import { useModel } from '../context'

import type { IPropsTodoStatusBadge } from '../types'

const Index = (props: IPropsTodoStatusBadge) => {
	const { status } = props
	const { getStatusConfig } = useModel()
	const status_config = getStatusConfig(status)
	const Icon = status_config.icon

	return (
		<Badge
			variant='secondary'
			className={$cx(
				`
				gap-1.5
				px-2.5 py-1
				rounded-full
				text-[11px] font-medium
				border-none
			`,
				status_config.badge_class
			)}
		>
			<Icon size={12}></Icon>
			{status_config.label}
		</Badge>
	)
}

export default $app.memo(Index)

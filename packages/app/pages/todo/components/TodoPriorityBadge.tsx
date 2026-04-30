import { Flag } from 'lucide-react'

import { Badge } from '@/__shadcn__/components/ui/badge'

import { useModel } from '../context'

import type { IPropsTodoPriorityBadge } from '../types'

const Index = (props: IPropsTodoPriorityBadge) => {
	const { priority } = props
	const { getPriorityConfig } = useModel()
	const priority_config = getPriorityConfig(priority)

	if (!priority_config) {
		return null
	}

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
				priority_config.badge_class
			)}
		>
			<Flag size={12}></Flag>
			{priority_config.label}
		</Badge>
	)
}

export default $app.memo(Index)

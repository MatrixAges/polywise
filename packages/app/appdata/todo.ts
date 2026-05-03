import { Archive, CircleCheck, CircleDashed, CircleDot, CircleX, Loader, View } from 'lucide-react'

import type { LucideIcon } from 'lucide-react'

export const todo_status_icon_map = {
	draft: {
		Icon: CircleDashed,
		color: 'text-std-300'
	},
	pending: {
		Icon: CircleDot,
		color: 'text-std-600'
	},
	processing: {
		Icon: Loader,
		color: 'text-std-black'
	},
	unreview: {
		Icon: View,
		color: 'text-indigo-500'
	},
	done: {
		Icon: CircleCheck,
		color: 'text-green-500'
	},
	error: {
		Icon: CircleX,
		color: 'text-red-500'
	},
	archive: {
		Icon: Archive,
		color: 'text-teal-500'
	}
} as Record<string, { Icon: LucideIcon; color: string }>

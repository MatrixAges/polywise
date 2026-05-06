import { Archive, CircleCheck, CircleDashed, CircleSlash, CircleX, Loader, View } from 'lucide-react'

import type { LucideIcon } from 'lucide-react'

export const todo_status_icon_map = {
	draft: {
		Icon: CircleDashed,
		color: 'text-std-300'
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
	canceled: {
		Icon: CircleSlash,
		color: 'text-amber-500'
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

export const todo_priority_icon_map = {
	low: 'text-std-700 bg-std-100',
	medium: 'text-emerald-500 bg-emerald-500/10',
	high: 'text-purple-700 bg-purple-500/16',
	urgent: 'text-rose-700 bg-rose-500/16'
} as Record<string, string>

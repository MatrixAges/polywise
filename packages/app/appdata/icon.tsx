import { Languages, ShieldAlert } from 'lucide-react'

import type { ElementType } from 'react'

export const icon_map = {
	lang: Languages,
	error: ShieldAlert
} as Record<string, ElementType>

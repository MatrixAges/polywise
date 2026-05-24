'use client'

import { useEffect } from 'react'
import useTheme from '@website/hooks/useTheme'
import { usePathname } from 'next/navigation'

import { handleTheme, script_handle_theme } from './script'

const Index = () => {
	const pathname = usePathname()
	const { theme } = useTheme()

	useEffect(() => {
		handleTheme(pathname, theme)
	}, [pathname, theme])

	const args = JSON.stringify([pathname, theme]).slice(1, -1)

	return (
		<script
			suppressHydrationWarning
			dangerouslySetInnerHTML={{ __html: `(${script_handle_theme.toString()})(${args})` }}
		/>
	)
}

export default Index

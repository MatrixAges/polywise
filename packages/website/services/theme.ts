'use server'

import { FORCE_DARK, THEME } from '@website/app.config'
import { cookies } from 'next/headers'

import type { Theme } from '@website/types'

interface ResGetUserLocale {
	theme: Theme
	cookie: boolean
}

export const getUserTheme = async () => {
	const cookie_store = await cookies()
	const force_dark = cookie_store.get(FORCE_DARK)?.value === '1'

	if (force_dark) return { theme: 'dark', cookie: true } as ResGetUserLocale

	const theme = cookie_store.get(THEME)?.value as Theme | undefined

	if (theme) return { theme, cookie: true } as ResGetUserLocale

	return { theme: 'dark', cookie: false } as ResGetUserLocale
}

export const setUserTheme = async (v: Theme) => {
	const now = new Date()

	;(await cookies()).set(THEME, v, { expires: now.setFullYear(now.getFullYear() + 3) })
}

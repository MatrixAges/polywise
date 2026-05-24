import { THEME } from '@website/app.config'
import { useMemoizedFn } from '@website/hooks/ahooks'

import useCookie from './useCookie'

import type { Theme } from '@website/types'

export default () => {
	const [theme, setThemeCookie] = useCookie(THEME)

	const setTheme = useMemoizedFn((v: Theme) => {
		const change = () => {
			setThemeCookie(v)

			if (typeof document !== 'undefined') {
				document.documentElement.setAttribute('data-theme', v)
				document.documentElement.style.colorScheme = v
			}
		}

		if (document?.startViewTransition) {
			document.startViewTransition(change)
		} else {
			change()
		}
	})

	return { theme: theme || 'light', setTheme } as { theme: Theme; setTheme: typeof setTheme }
}

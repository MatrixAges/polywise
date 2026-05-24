import { FORCE_DARK } from '@website/app.config'
import retryUntil from '@website/utils/retryUntil'
import Cookies from 'js-cookie'

import type { Theme } from '@website/types'

export const handleTheme = (pathname: string, theme: Theme) => {
	const html = document.documentElement
	const prev_force_dark = Cookies.get(FORCE_DARK)
	const is_doc = pathname.indexOf('/docs') !== -1

	let event = null as null | CustomEvent

	if (theme !== 'dark' && !is_doc) {
		html.setAttribute('data-theme', 'dark')
		html.style.colorScheme = 'dark'

		if (prev_force_dark !== '1') Cookies.set(FORCE_DARK, '1', { expires: 3 })

		event = new CustomEvent('changeTheme', { detail: 'dark' })
	} else {
		html.setAttribute('data-theme', theme)
		html.style.colorScheme = theme

		if (prev_force_dark !== '0') Cookies.set(FORCE_DARK, '0', { expires: 3 })

		event = new CustomEvent('changeTheme', { detail: theme })
	}

	retryUntil(
		() => {
			window.__theme_emitter.dispatchEvent(event)
		},
		() => window.__theme_emitter
	)
}

export const script_handle_theme = (pathname: string) => {
	window.__theme_emitter = new EventTarget()

	const getCookie = (name: string) => {
		const cookies = document.cookie.split(';')
		for (let i = 0; i < cookies.length; i++) {
			const cookie = cookies[i].trim()
			if (cookie.startsWith(name + '=')) {
				return cookie.substring(name.length + 1)
			}
		}
		return null
	}

	const setCookie = (key: string, value: string, expire: number) => {
		let cookie = `${encodeURIComponent(key)}=${encodeURIComponent(value)};`

		const expires = new Date()

		expires.setTime(expires.getTime() + expire * 1000 * 86400)

		cookie += `expires=${expires.toUTCString()};`

		document.cookie = cookie
	}

	const THEME = 'POLYWISE_WEBSITE_THEME'
	const FORCE_DARK = 'POLYWISE_WEBSITE_FORCE_DARK'
	const html = document.documentElement
	const theme = getCookie(THEME) || 'dark'
	const prev_force_dark = getCookie(FORCE_DARK)
	const is_doc = pathname.indexOf('/docs') !== -1

	let event = null as CustomEvent | null

	const retryUntil = (retry_fn: Function, until_fn: () => boolean) => {
		if (!until_fn()) {
			window.requestAnimationFrame(() => retryUntil(retry_fn, until_fn))
		} else {
			retry_fn()
		}
	}

	if (theme !== 'dark' && !is_doc) {
		html.setAttribute('data-theme', 'dark')
		html.style.colorScheme = 'dark'

		if (prev_force_dark !== '1') setCookie(FORCE_DARK, '1', 3)

		event = new CustomEvent('changeTheme', { detail: 'dark' })
	} else {
		html.setAttribute('data-theme', theme)
		html.style.colorScheme = theme

		if (prev_force_dark !== '0') setCookie(FORCE_DARK, '0', 3)

		event = new CustomEvent('changeTheme', { detail: theme })
	}

	retryUntil(
		() => {
			window.__theme_emitter.dispatchEvent(event)
		},
		() => window.__theme_listened === true && window.__theme_emitter
	)
}

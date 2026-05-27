import dayjs from 'dayjs'
import { makeAutoObservable } from 'mobx'
import { setStoreWhenChange } from 'stk/mobx'
import { local } from 'stk/storage'
import { injectable } from 'tsyringe'

import { Util } from '@/models/common'
import { getSystemTheme, setGlobalAnimation, theme_match_media } from '@/utils'

import type { Theme } from '@/types'

@injectable()
export default class Index {
	theme_source = 'light' as Theme
	theme_value = 'light' as Exclude<Theme, 'system'>
	auto_theme = false

	constructor(public util: Util) {
		makeAutoObservable(this, { util: false }, { autoBind: true })
	}

	async init() {
		const deinit = await setStoreWhenChange(['theme_source'], this)

		this.util.acts = [deinit]

		this.setTheme(this.theme_source || 'system', true)

		this.checkTheme()
	}

	handleThemeChange(e: MediaQueryListEvent) {
		this.setThemeValue(e.matches ? 'dark' : 'light')
	}

	onThemeChange() {
		this.offThemeChange()

		theme_match_media.addEventListener('change', this.handleThemeChange)
	}

	offThemeChange() {
		theme_match_media.removeEventListener('change', this.handleThemeChange)
	}

	async setTheme(v: Index['theme_source'], initial?: boolean) {
		if (v === 'system') {
			this.onThemeChange()
		} else {
			this.offThemeChange()
		}

		this.theme_source = v

		this.setThemeValue(v !== 'system' ? v : getSystemTheme(), initial)
	}

	setThemeValue(v: Index['theme_value'], initial?: boolean) {
		local.theme_value = v

		if (v === this.theme_value) return

		const change = () => {
			this.theme_value = v

			document.documentElement.setAttribute('data-theme', v)
			document.documentElement.style.colorScheme = v
		}

		if (!initial) {
			setGlobalAnimation()

			document.startViewTransition(change)
		} else {
			change()
		}
	}

	toggleAutoTheme() {
		this.auto_theme = !this.auto_theme

		this.checkTheme()
	}

	checkTheme() {
		if (!this.auto_theme) return

		const hour = dayjs().hour()

		this.setTheme(hour >= 6 && hour < 18 ? 'light' : 'dark')
	}

	deinit() {
		this.offThemeChange()

		this.util.deinit()
	}
}

import Big from 'big.js'
import dayjs from 'dayjs'
import i18next from 'i18next'
import { makeAutoObservable } from 'mobx'
import { initReactI18next } from 'react-i18next'
import { setStoreWhenChange } from 'stk/mobx'
import { local } from 'stk/storage'
import { injectable } from 'tsyringe'
import { config, locales } from 'zod'

import { Util } from '@/models/common'
import {
	conf,
	getLang,
	getSystemTheme,
	ipc,
	is_electron,
	relaunch,
	resourcesToBackend,
	setGlobalAnimation,
	theme_match_media
} from '@/utils'

import type { Lang, Theme } from '@/types'
import type { PanelImperativeHandle } from 'react-resizable-panels'

@injectable()
export default class Index {
	lang = 'en' as Lang
	theme_source = 'light' as Theme
	theme_value = 'light' as Exclude<Theme, 'system'>
	auto_theme = false
	settings_visible = false

	panel_ref = null as unknown as PanelImperativeHandle
	panel_collapsed = false

	current_page: 'home' | 'memory' | 'browser' = 'home'

	constructor(public util: Util) {
		makeAutoObservable(this, { util: false, panel_ref: false }, { autoBind: true })
	}

	async init() {
		const off = await setStoreWhenChange(['lang', 'theme_source', 'panel_collapsed', 'panel_width'], this)

		this.util.acts = [off]

		await this.setLocale(this.lang ?? getLang(navigator.language))

		this.setTheme(this.theme_source || 'system', true)

		this.checkTheme()
	}

	async setLocale(lang: Lang) {
		i18next
			.use(resourcesToBackend)
			.use(initReactI18next)
			.init({
				lng: this.lang,
				fallbackLng: 'en',
				load: 'currentOnly',
				returnObjects: true,
				interpolation: { escapeValue: false }
			})

		const res = await import(`@/locales/dayjs/${lang}`)

		dayjs.locale(lang, res.default)

		let zod_locale

		switch (lang) {
			case 'en':
				zod_locale = locales.en()
				break
			case 'zh-cn':
				zod_locale = locales.zhCN()
				break
		}

		config(zod_locale)
	}

	setLang(v: Lang) {
		if (v === this.lang) return

		this.lang = v

		conf.set('lang', v)

		relaunch()
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
		if (is_electron) await ipc.app.setTheme.mutate({ theme: v })

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

	setPanelRef(v: Index['panel_ref']) {
		this.panel_ref = v
	}

	togglePanel() {
		if (this.panel_ref.isCollapsed()) {
			const last_width = local.layout_panel_last_width as number

			if (last_width) {
				this.panel_ref.resize(last_width.toString())
			} else {
				this.panel_ref.expand()
			}
		} else {
			this.panel_ref.collapse()
		}

		this.panel_collapsed = this.panel_ref.isCollapsed()
	}

	updatePanelState() {
		this.panel_collapsed = this.panel_ref.isCollapsed()
	}

	toggleSettings() {
		this.settings_visible = !this.settings_visible
	}

	off() {
		this.offThemeChange()

		this.util.off()
	}
}

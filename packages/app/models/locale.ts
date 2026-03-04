import dayjs from 'dayjs'
import i18next from 'i18next'
import { makeAutoObservable } from 'mobx'
import { initReactI18next } from 'react-i18next'
import { setStoreWhenChange } from 'stk/mobx'
import { injectable } from 'tsyringe'
import { config, locales } from 'zod'

import { Util } from '@/models/common'
import { conf, getLang, relaunch, resourcesToBackend } from '@/utils'

import type { AlertArgs } from '@/layout/components/Alert'
import type { Lang } from '@/types'

@injectable()
export default class Index {
	lang = 'en' as Lang

	constructor(public util: Util) {
		makeAutoObservable(this, { util: false }, { autoBind: true })
	}

	async init() {
		const deinit = await setStoreWhenChange(['lang'], this)

		this.util.acts = [deinit]

		await this.setLocale(this.lang ?? getLang(navigator.language))
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

	async setLang(v: Lang) {
		if (v === this.lang) return

		const res = await $app.Event.emit('app/alert', {
			icon: 'lang',
			title: 'Change Language',
			desc: 'Changing the application language will force a page refresh'
		} as AlertArgs)

		if (!res) return

		this.lang = v

		conf.set('lang', v)

		relaunch()
	}

	deinit() {
		this.util.deinit()
	}
}

import { makeAutoObservable } from 'mobx'
import { setStoreWhenChange } from 'stk/mobx'
import { injectable } from 'tsyringe'

import { Util } from '@/models/common'
import { alert, conf, ensureI18nReady, relaunch, resolveLocaleLang } from '@/utils'

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

		await this.setLocale(resolveLocaleLang(this.lang))
	}

	async setLocale(lang: Lang) {
		this.lang = lang

		await ensureI18nReady(lang)
	}

	async setLang(v: Lang) {
		if (v === this.lang) return

		const res = await alert({
			icon: 'lang',
			title: $t('lang_change.title'),
			desc: $t('lang_change.desc')
		})

		if (!res) return

		this.lang = v

		conf.set('lang', v)

		relaunch()
	}

	deinit() {
		this.util.deinit()
	}
}

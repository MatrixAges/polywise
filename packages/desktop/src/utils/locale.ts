import en from '@desktop/locales/en'
import zh_cn from '@desktop/locales/zh-cn'
import { conf } from '@desktop/utils'
import { app } from 'electron'
import i18next from 'i18next'

import type { Lang } from '@app/types'

const conf_lang = await conf.get('lang')
const sys_lang = app.getLocale().indexOf('zh') !== -1 ? 'zh-cn' : 'en'
const lang = (conf_lang || sys_lang) as Lang

const i18n_lang_map = {
	en: 'en',
	'zh-cn': 'zh-CN'
} as const

const resource_map = {
	en: en,
	'zh-cn': zh_cn
} as const

const i18n_lang = i18n_lang_map[lang]

i18next.init({
	initAsync: false,
	lng: i18n_lang,
	fallbackLng: i18n_lang,
	load: 'currentOnly',
	returnObjects: true,
	resources: { [i18n_lang]: resource_map[lang] }
})

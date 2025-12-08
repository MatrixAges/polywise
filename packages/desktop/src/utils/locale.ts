import { app } from 'electron'
import i18next from 'i18next'

import en from '@desktop/locales/en'
import zh_cn from '@desktop/locales/zh-cn'
import { conf } from '@desktop/utils'

import type { Lang } from '@app/types'

const conf_lang = await conf.get('lang')
const sys_lang = app.getLocale().indexOf('zh') !== -1 ? 'zh-cn' : 'en'
const lang = (conf_lang || sys_lang) as Lang

const locale_map = {
	en: en,
	'zh-cn': zh_cn
}

i18next.init({
	initAsync: false,
	lng: lang,
	fallbackLng: lang,
	load: 'currentOnly',
	returnObjects: true,
	resources: { [lang]: locale_map[lang] }
})

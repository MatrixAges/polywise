import ja from '@website/locales/antd/ja'
import zh from '@website/locales/antd/zh-cn'
import en from 'antd/locale/en_US'

import type { Locales } from '@website/app.config'

const locale_map = {
	en,
	ja,
	zh
}

export default (lang: Locales) => {
	return locale_map[lang] ?? en
}

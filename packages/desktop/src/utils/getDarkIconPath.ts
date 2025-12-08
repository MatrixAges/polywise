import { nativeTheme } from 'electron'

import { is_mac } from './index'

export default (dark?: boolean) => {
	if (dark) return `_dark`
	if (!is_mac) return ''
	if (!nativeTheme.shouldUseDarkColors) return ''

	return `_dark`
}

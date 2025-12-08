import { nativeTheme } from 'electron'

import { conf } from '@desktop/utils'

import type { Theme } from '@app/types'

export default () => {
	const theme_source = (conf.get('theme_source') || 'system') as Theme

	if (theme_source !== 'system') return theme_source

	return nativeTheme.shouldUseDarkColors ? 'dark' : 'light'
}

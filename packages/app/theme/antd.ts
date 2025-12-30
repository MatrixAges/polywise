import { theme } from 'antd'

import type { Theme } from '@/types'
import type { ThemeConfig } from 'antd'

const { defaultAlgorithm, darkAlgorithm } = theme

export default (theme: Theme) => {
	const is_dark = theme === 'dark'

	return {
		algorithm: is_dark ? darkAlgorithm : defaultAlgorithm,
		hashed: false,
		cssVar: { prefix: 'pw' },
		token: {
			colorPrimary: is_dark ? '#00E676' : '#8BC34A'
		},
		components: {
			Button: {
				defaultShadow: 'none',
				primaryShadow: 'none',
				dangerShadow: 'none'
			},
			Form: {
				itemMarginBottom: 12
			},
			Switch: {
				handleSizeSM: 12,
				trackHeightSM: 16,
				trackMinWidthSM: 28,
				handleShadow: 'unset'
			}
		}
	} as ThemeConfig
}

import { theme } from 'antd'

import type { Theme } from '@/types'
import type { ThemeConfig } from 'antd'
import type { DeepRequired } from 'ts-essentials'

const { defaultAlgorithm, darkAlgorithm } = theme

export default (theme: Theme) => {
	const is_dark = theme === 'dark'

	const getTargetConfig = <T extends object>(
		common: Partial<T>,
		dark_config: Partial<T>,
		light_config: Partial<T>
	) => {
		return Object.assign(common, is_dark ? dark_config : light_config) as T
	}

	return {
		algorithm: is_dark ? darkAlgorithm : defaultAlgorithm,
		hashed: false,
		cssVar: { prefix: 'pw' },
		token: {
			controlHeightLG: 34,
			controlHeight: 30,
			controlHeightSM: 26,
			controlHeightXS: 22,
			controlOutline: 'none',
			hoverBorderColor: 'transparent',
			colorPrimary: 'var(--color-std-800)',
			lineHeight: 1.62,
			fontSize: 13,
			fontFamily: 'var(--font_family)'
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
			Switch: getTargetConfig<DeepRequired<ThemeConfig>['components']['Switch']>(
				{
					handleSizeSM: 14,
					trackHeightSM: 18,
					trackMinWidthSM: 32,
					handleShadow: 'unset',
					colorTextTertiary: 'rgba(var(--color_contrast_rgb),0.06)',
					colorTextQuaternary: 'rgba(var(--color_contrast_rgb),0.06)'
				},
				{
					handleBg: 'rgba(var(--color_contrast_rgb),0.6)',
					colorPrimary: 'rgba(var(--color_contrast_rgb),0.3)',
					colorPrimaryHover: 'rgba(var(--color_contrast_rgb),0.18)'
				},
				{
					handleBg: 'rgba(var(--color_std_rgb),0.9)',
					colorPrimary: 'rgba(var(--color_contrast_rgb),0.72)',
					colorPrimaryHover: 'rgba(var(--color_contrast_rgb),0.81)'
				}
			),
			Select: {
				borderRadius: 999,
				borderRadiusSM: 999,
				optionSelectedBg: 'var(--color-std-200)',
				colorBgContainer: 'var(--color-std-200)',
				activeBorderColor: 'transparent'
			}
		}
	} as ThemeConfig
}

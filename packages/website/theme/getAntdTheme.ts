import common_vars from '@website/theme/common'
import { match } from 'ts-pattern'

import common_antd from './common/antd'
import dark from './dark'
import light from './light'

import type { Theme } from '@website/types'
import type { ThemeConfig } from 'antd'

export default (theme: Theme) => {
	const vars = match(theme)
		.with('light', () => light)
		.with('dark', () => dark)
		.exhaustive()

	return {
		hashed: false,
		token: {
			...common_antd.token,
			colorPrimary: `rgb(${common_vars.color_main_rgb})`,
			colorText: vars.color_text,
			colorTextBase: vars.color_text,
			colorBgBase: vars.color_bg,
			colorBgContainer: vars.color_bg,
			colorBgElevated: vars.color_bg_1,
			colorBgLayout: vars.color_bg_1,
			colorBorder: vars.color_border_light,
			colorBorderSecondary: vars.color_border_light,
			controlItemBgActive: vars.color_bg_2,
			switchHeight: 34,
			boxShadow: vars.shadow,
			borderRadiusXS: 3,
			borderRadiusSM: 6,
			borderRadius: 6
		},
		components: {
			Switch: {
				colorPrimary: vars.color_text,
				controlHeight: 24,
				controlHeightSM: 22,
				controlHeightXS: 20
			},
			DatePicker: {
				colorPrimary: vars.color_text,
				controlHeight: 24,
				cellHeight: 24,
				cellWidth: 24,
				timeCellHeight: 24,
				timeColumnWidth: 36,
				textHeight: 30,
				fontSize: 12,
				colorSplit: 'transparent'
			},
			Dropdown: {
				controlItemBgHover: vars.color_bg_2
			},
			Input: {
				colorPrimary: vars.color_text,
				colorPrimaryHover: vars.color_text_grey
			},
			Select: {
				colorPrimary: vars.color_text,
				optionActiveBg: vars.color_bg_2,
				colorPrimaryHover: vars.color_text_light
			},
			Segmented: {
				borderRadiusSM: 6,
				borderRadiusXS: 4,
				controlHeightSM: 24,
				colorBgLayout: vars.color_bg_1
			},
			Slider: {
				handleSize: 8,
				handleSizeHover: 10
			},
			Radio: {
				colorPrimary: vars.color_text,
				dotSize: 9,
				radioSize: 12
			},
			Tabs: {
				colorPrimary: vars.color_text
			},
			Pagination: {
				controlHeight: 24
			},
			Menu: {
				itemHeight: 32,
				itemMarginBlock: 0,
				itemMarginInline: 0,
				itemPaddingInline: 0,
				itemBorderRadius: 6,
				iconSize: 16,
				subMenuItemBg: 'unset',
				itemSelectedColor: vars.color_text
			}
		}
	} as ThemeConfig
}

'use client'

import '../presets'

import { memo, useLayoutEffect, useState } from 'react'
import { useMemoizedFn } from '@website/hooks/ahooks'
import useAntdLocale from '@website/hooks/useAntdLocale'
import { getAntdTheme } from '@website/theme'
import retryUntil from '@website/utils/retryUntil'
import { ConfigProvider } from 'antd'

import type { Locales } from '@website/app.config'
import type { Theme } from '@website/types'
import type { ConfigProviderProps } from 'antd/es/config-provider'
import type { PropsWithChildren } from 'react'

interface IProps extends PropsWithChildren {
	locale: Locales
	theme: Theme
}

const Index = (props: IProps) => {
	const { children, locale, theme } = props
	const app_locale = useAntdLocale(locale)
	const [app_theme, setAppTheme] = useState(() => getAntdTheme(theme))

	const onChangeTheme = useMemoizedFn(({ detail }: any) => {
		const target_theme = getAntdTheme(detail)

		setAppTheme(target_theme)
	})

	useLayoutEffect(() => {
		retryUntil(
			() => {
				window.__theme_emitter.addEventListener('changeTheme', onChangeTheme)
				window.__theme_listened = true
			},
			() => window.__theme_emitter
		)

		return () => window.__theme_emitter.removeEventListener('changeTheme', onChangeTheme)
	}, [])

	const props_config_provider: ConfigProviderProps = {
		prefixCls: 'if',
		iconPrefixCls: 'if-icon',
		locale: app_locale,
		theme: app_theme,
		virtual: false,
		getPopupContainer: n => n?.parentElement!
	}

	return <ConfigProvider {...props_config_provider}>{children}</ConfigProvider>
}

export default memo(Index)

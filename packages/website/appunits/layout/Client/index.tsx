'use client'

import { useEffect, useMemo } from 'react'
import { LOCALE, THEME } from '@website/app.config'
import Cookie from '@website/appunits/layout/Cookie'
import Footer from '@website/appunits/layout/Footer'
import Header from '@website/appunits/layout/Header'
import { $ } from '@website/utils'
import Cookies from 'js-cookie'
import { usePathname } from 'next/navigation'

import styles from './index.module.css'

import type { Locales } from '@website/app.config'
import type { Theme } from '@website/types'
import type { PropsWithChildren } from 'react'

const excludes = ['/features', '/docs', '/pay']

export interface IPropsClient extends PropsWithChildren {
	locale: Locales
	locale_cookie_exsit: boolean
	theme: Theme
	theme_cookie_exsit: boolean
}

const Index = (props: IPropsClient) => {
	const { children, locale, locale_cookie_exsit, theme, theme_cookie_exsit } = props
	const pathname = usePathname()

	useEffect(() => {
		import('@website/utils/SmoothScroll').then(res => {
			res.default({ animationTime: 450, stepSize: 72, touchpadSupport: true })
		})
	}, [])

	useEffect(() => {
		if (!locale_cookie_exsit) {
			Cookies.set(LOCALE, locale, { expires: 360 })
		}
	}, [locale, locale_cookie_exsit])

	useEffect(() => {
		if (!theme_cookie_exsit) {
			Cookies.set(THEME, theme, { expires: 360 })
		}
	}, [theme, theme_cookie_exsit])

	const show_layout = useMemo(() => !excludes.some(item => pathname.includes(item)), [pathname])

	return (
		<div className={$.cx('flex w-full flex-col', styles._local)}>
			<Cookie />
			{show_layout && <Header />}
			{children}
			{show_layout && <Footer />}
		</div>
	)
}

export default $.memo(Index)

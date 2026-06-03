import '@website/styles/vars.global.css'
import '@website/styles/tailwind.global.css'
import '@website/styles/class.global.css'
import '@website/styles/shiki.global.css'

import { Client, Router } from '@website/appunits/layout'
import ToastProvider from '@website/components/ui/ToastProvider'
import { getUserLocale, getUserTheme } from '@website/services'
import { google_analytics_id } from '@website/utils/const'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'

import type { IPropsClient } from '@website/appunits/layout/Client'
import type { Metadata } from 'next'
import type { PropsWithChildren } from 'react'

export const metadata: Metadata = {
	title: 'Polywise - The open source agentic content system',
	description: 'Polywise is the open source agentic content system to make your contents alive.'
}

const RootLayout = async ({ children }: PropsWithChildren) => {
	const messages = await getMessages()
	const { locale, cookie: locale_cookie_exsit } = await getUserLocale()
	const { theme, cookie: theme_cookie_exsit } = await getUserTheme()

	const props_client: IPropsClient = {
		locale,
		locale_cookie_exsit,
		theme,
		theme_cookie_exsit
	}

	const google_analytics_init = `
		window.dataLayer = window.dataLayer || [];
		function gtag(){dataLayer.push(arguments);}
		gtag('js', new Date());
		gtag('config', '${google_analytics_id}');
	`

	return (
		<html lang={locale} data-theme={theme} style={{ colorScheme: theme }} suppressHydrationWarning>
			<head>
				<meta charSet='UTF-8' />
				<link id='favicon' rel='icon' type='image/svg+xml' href='/logo.svg' />
				<link rel='stylesheet' href='/styles/init.css' />
				<link rel='stylesheet' href='/styles/icon_font.css' />
				<link rel='stylesheet' href='/theme/common.css' />
				<link rel='stylesheet' href='/theme/light.css' />
				<link rel='stylesheet' href='/theme/dark.css' />
				<script async src={`https://www.googletagmanager.com/gtag/js?id=${google_analytics_id}`} />
				<script dangerouslySetInnerHTML={{ __html: google_analytics_init }} />
			</head>
			<body>
				<Router />
				<NextIntlClientProvider locale={locale} messages={messages}>
					<ToastProvider>
						<Client {...props_client}>{children}</Client>
					</ToastProvider>
				</NextIntlClientProvider>
			</body>
		</html>
	)
}

export default RootLayout

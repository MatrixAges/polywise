import { useLayoutEffect, useState } from 'react'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { Outlet, useLocation, useNavigate } from 'react-router'
import { container } from 'tsyringe'

import { setting_items } from '@/appdata'
import { Container, Sidebar } from '@/components'
import { useGlobal } from '@/context'
import { loadPageLocale, usePageLocale } from '@/hooks'

import Model from './model'

const Index = () => {
	usePageLocale('setting')

	const global = useGlobal()
	const { t } = useTranslation('setting')
	const [x] = useState(() => container.resolve(Model))
	const navgate = useNavigate()
	const { pathname } = useLocation()

	const s = global.setting

	useLayoutEffect(() => {
		x.init()

		return () => x.deinit()
	}, [])

	const getSettingMenuTitle = (title?: string) => {
		switch (title) {
			case 'general':
				return t('menu.general')
			case 'model_provider':
				return t('menu.model_provider')
			case 'model_setting':
				return t('menu.model_setting')
			case 'mcp':
				return t('menu.mcp')
			case 'oauth_provider':
				return t('menu.oauth_provider')
			case 'service_provider':
				return t('menu.service_provider')
			case 'im':
				return t('menu.im')
			case 'about_feedback':
				return t('menu.about_feedback')
			default:
				return title
		}
	}

	return (
		<div className='flex h-full w-full'>
			{!s.sidebar_collapsed && (
				<Sidebar
					groups={[
						{
							label: t('sidebar.group'),
							items: setting_items.map(item => ({
								...item,
								title: getSettingMenuTitle(item.title)
							}))
						}
					]}
					current={pathname === '/setting' ? '' : pathname.replace('/setting/', '')}
					width={180}
					setCurrent={v => navgate('/setting/' + v)}
				></Sidebar>
			)}
			<Container>
				<Outlet></Outlet>
			</Container>
		</div>
	)
}

export const loader = () => loadPageLocale('setting')
export const Component = new $app.Handle(Index).by(observer).by($app.memo).get()

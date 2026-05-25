'use client'

import { useEffect, useState } from 'react'
import { CookieIcon } from '@phosphor-icons/react'
import { useMemoizedFn } from '@website/hooks/ahooks'
import { $ } from '@website/utils'
import { is_server } from '@website/utils/const'
import { useTranslations } from 'next-intl'

import styles from './index.module.css'

const Index = () => {
	const t = useTranslations('layout')
	const [cookie_ok, setCookieOk] = useState(true)

	useEffect(() => {
		if (!is_server) {
			const ok = localStorage.getItem('cookie_ok')

			if (!ok) setCookieOk(false)
		}
	}, [])

	const get = useMemoizedFn(() => {
		setCookieOk(true)

		localStorage.setItem('cookie_ok', '1')
	})

	return !cookie_ok ? (
		<div className={$.cx('fixed z-100 flex justify-center', styles._local)}>
			<div className='cookie_wrap flex items-center'>
				<div className='icon_wrap flex items-center justify-center'>
					<CookieIcon weight='duotone' size={24}></CookieIcon>
				</div>
				<div className='desc'>{t('Cookie.desc')}</div>
				<button
					className='
							flex
							items-center justify-center
							btn_get_wrap clickable
						'
					onClick={get}
				>
					{t('Cookie.btn_get')}
				</button>
			</div>
		</div>
	) : null
}

export default $.memo(Index)

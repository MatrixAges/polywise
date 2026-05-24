'use client'

import { useMemo } from 'react'
import { locales } from '@website/app.config'
import useLocale from '@website/hooks/useLocale'
import { $ } from '@website/utils'
import { Select } from 'antd'
import { useTranslations } from 'next-intl'

import styles from './index.module.css'

const Index = () => {
	const { locale, setLocale } = useLocale()
	const t_common = useTranslations('common')

	const locale_options = useMemo(() => {
		return locales.map(item => ({ label: t_common(`lang.${item}`), value: item }))
	}, [t_common])

	return (
		<Select
			className={styles._local}
			placement='bottomRight'
			suffixIcon={null}
			value={locale}
			options={locale_options}
			getPopupContainer={() => document.body}
			onChange={setLocale}
		></Select>
	)
}

export default $.memo(Index)

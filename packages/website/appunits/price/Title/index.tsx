import { $ } from '@website/utils'
import { useTranslations } from 'next-intl'

import styles from './index.module.css'

const Index = () => {
	const t = useTranslations('price')

	return (
		<div className={$.cx('flex w-full flex-col items-center', styles._local)}>
			<h1 className='section_title'>{t('Title.title')}</h1>
			<h2 className='desc'>{t('Title.line_1')}</h2>
			<h2 className='desc'>{t('Title.line_2')}</h2>
		</div>
	)
}

export default $.memo(Index)

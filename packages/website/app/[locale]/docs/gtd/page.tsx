import { getUserLocale } from '@website/services'
import { $ } from '@website/utils'

import Items from './Items'

import styles from './index.module.css'

const Index = async () => {
	const { locale } = await getUserLocale()
	const is_cn = locale.indexOf('zh') !== -1

	return (
		<div className={$.cx('w-full', styles._local)}>
			<Items is_cn={is_cn}></Items>
		</div>
	)
}

export default Index

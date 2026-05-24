import { Items, Title } from '@website/appunits/price'
import { $ } from '@website/utils'

import styles from './index.module.css'

const Index = () => {
	return (
		<div className={$.cx('limited_content_wrap flex flex-col items-center', styles._local)}>
			<Title></Title>
			<Items></Items>
		</div>
	)
}

export default Index

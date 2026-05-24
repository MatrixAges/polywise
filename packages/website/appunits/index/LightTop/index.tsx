import { $ } from '@website/utils'

import styles from './index.module.css'

const Index = () => {
	return (
		<section className='limited_content_wrap'>
			<div className={$.cx('relative flex w-full justify-center', styles._local)}>
				<img className='star_light relative' src='/images/svg/star_light.svg' alt='star_light' />
			</div>
		</section>
	)
}

export default $.memo(Index)

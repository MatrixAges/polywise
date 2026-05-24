import { $ } from '@website/utils'

import styles from './index.module.css'

const Index = () => {
	return <div className={$.cx('w-full', styles._local)}></div>
}

export default $.memo(Index)

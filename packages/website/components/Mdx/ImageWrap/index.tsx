import { $ } from '@website/utils'
import { base_url_files_website } from '@website/utils/const'

import styles from './index.module.css'

interface IProps {
	src: string
	width?: number
	small?: boolean
	no_bottom?: boolean
	black?: boolean
}

const Index = (props: IProps) => {
	const { src, width, small, no_bottom, black } = props

	return (
		<div
			className={$.cx(
				'image_wrap box-border',
				styles._local,
				small && styles.small,
				no_bottom && styles.no_bottom,
				black && styles.black
			)}
			style={{ width }}
		>
			<img alt='img' src={`${base_url_files_website}/docs/${src}`} />
		</div>
	)
}

export default $.memo(Index)

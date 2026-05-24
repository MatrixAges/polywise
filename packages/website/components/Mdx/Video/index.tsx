import { $ } from '@website/utils'
import { match } from 'ts-pattern'

import styles from './index.module.css'

interface IProps {
	type: 'youtube' | 'bilibili'
	id: string
}

const Index = (props: IProps) => {
	const { type, id } = props

	const Iframe = match(type)
		.with('youtube', () => (
			<iframe
				src={`https://www.youtube.com/embed/${id}`}
				title='YouTube video player'
				allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share'
				referrerPolicy='strict-origin-when-cross-origin'
				allowFullScreen
			></iframe>
		))
		.with('bilibili', () => (
			<iframe
				src={`//player.bilibili.com/player.html?isOutside=true&bvid=${id}`}
				scrolling='no'
				frameBorder='no'
				allowFullScreen
			></iframe>
		))
		.exhaustive()

	return <div className={$.cx('flex w-full', styles._local)}>{Iframe}</div>
}

export default $.memo(Index)

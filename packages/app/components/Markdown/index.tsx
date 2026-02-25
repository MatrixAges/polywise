import figure from '@microflash/rehype-figure'
import Markdown from 'react-markdown'
import slug from 'rehype-slug'
import breaks from 'remark-breaks'
import gfm from 'remark-gfm'
import images from 'remark-images'
import math from 'remark-math'

import styles from '@/styles/md.module.css'

import components from './components'

interface IProps {
	source: string
}

const remarkPlugins = [gfm, breaks, math, images]
const rehypePlugins = [slug, figure]

const Index = (props: IProps) => {
	const { source } = props

	return (
		<div className={styles._local}>
			<Markdown remarkPlugins={remarkPlugins} rehypePlugins={rehypePlugins} components={components}>
				{source}
			</Markdown>
		</div>
	)
}

export default $app.memo(Index)

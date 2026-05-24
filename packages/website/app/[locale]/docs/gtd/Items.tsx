import { $ } from '@website/utils'
import { useTranslations } from 'next-intl'

import { books } from './books'

interface IProps {
	is_cn?: boolean
}

const Index = (props: IProps) => {
	const { is_cn } = props
	const t = useTranslations('gtd')

	return (
		<div className='gtd_items small_content_wrap flex flex-wrap'>
			{books.map((item, index) => (
				<div className='gtd_item box-border flex' key={item}>
					<img className='image' src={`/books/${item}/${is_cn ? 'zh' : 'en'}.jpg`} alt={item} />
					<div className='desc_wrap box-border flex flex-col'>
						<h1 className='title'>《{t(`${index}.name`)}》</h1>
						<span className='desc'>{t(`${index}.desc`)}</span>
					</div>
				</div>
			))}
		</div>
	)
}

export default $.memo(Index)

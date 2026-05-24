import { CaretLeft, CaretRight } from '@phosphor-icons/react'
import { Link } from '@website/i18n/navigation'
import { $ } from '@website/utils'
import { useTranslations } from 'next-intl'

import styles from './index.module.css'

interface LinkItem {
	label: string
	key: string
}

interface IProps {
	prev?: LinkItem | null
	next?: LinkItem | null
}

const Index = (props: IProps) => {
	const { prev, next } = props
	const t = useTranslations('doc')

	return (
		<div className={$.cx('box-border w-full', styles._local)}>
			<div className='bottom_link_items box-border flex'>
				{prev && (
					<Link
						className='
							flex flex-col
							link_item prev clickable
						'
						href={`/docs/${prev.key}`}
					>
						<div className='link_item_top flex items-center'>
							<CaretLeft weight='bold'></CaretLeft>
							<span className='link_item_direction'>{t('BottomLink.prev')}</span>
						</div>
						<span className='link_item_title'>{prev.label}</span>
					</Link>
				)}
				{next && (
					<Link
						className='
							flex flex-col
							items-end
							link_item next clickable
						'
						href={`/docs/${next.key}`}
					>
						<div className='link_item_top flex items-center'>
							<span className='link_item_direction'>{t('BottomLink.next')}</span>
							<CaretRight weight='bold'></CaretRight>
						</div>
						<span className='link_item_title'>{next.label}</span>
					</Link>
				)}
			</div>
		</div>
	)
}

export default $.memo(Index)

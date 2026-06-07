import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'

import { Tabs } from '@/components'

import { getDetailTabItems } from '../../utils'
import { useModel } from '../context'
import OutlinePanel from './OutlinePanel'
import ProjectPanel from './ProjectPanel'
import RelatedPanel from './RelatedPanel'

import type { DetailTab } from '../../types'

const Index = () => {
	const x = useModel()
	const { t: raw_t } = useTranslation('post')
	const t = raw_t as unknown as (key: string, options?: Record<string, unknown>) => string
	const detail_tab_items = getDetailTabItems(t)

	return (
		<div
			className='
				flex flex-col shrink-0
				w-[210px]
				bg-std-50/60
				dark:bg-std-100/60 dark:border-r dark:border-border-light/60
			'
		>
			<div
				className='
					flex
					items-center
					h-9
					px-1.5
				'
			>
				{x.selected_post ? (
					<div className='min-w-0 flex-1'>
						<Tabs
							small
							items={detail_tab_items.map(item => ({
								key: item.key,
								title: item.title,
								Icon: item.Icon
							}))}
							active={x.detail_tab}
							onClick={value => x.setDetailTab(value as DetailTab)}
						></Tabs>
					</div>
				) : (
					<span className='text-std-400 text-sm'>{t('detail.loading_post')}</span>
				)}
			</div>
			<div className='min-h-0 flex-1 overflow-hidden'>
				{!x.selected_post ? (
					<div
						className='
							flex
							items-center justify-center
							h-full
							px-1.5
							text-sm text-std-400
							text-center
						'
					>
						{x.post_loading ? t('detail.loading_post_detail') : t('detail.select_post')}
					</div>
				) : x.detail_tab === 'outline' ? (
					<div className='h-full overflow-y-auto px-1.5'>
						<OutlinePanel></OutlinePanel>
					</div>
				) : x.detail_tab === 'related' ? (
					<RelatedPanel></RelatedPanel>
				) : (
					<ProjectPanel></ProjectPanel>
				)}
			</div>
		</div>
	)
}

export default observer(Index)

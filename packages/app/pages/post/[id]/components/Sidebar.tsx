import { observer } from 'mobx-react-lite'

import { TextTabs } from '@/components'

import { detail_tab_items } from '../../utils'
import { useModel } from '../context'
import OutlinePanel from './OutlinePanel'
import RelatedPanel from './RelatedPanel'
import SessionPanel from './SessionPanel'

import type { DetailTab } from '../../types'

const Index = () => {
	const x = useModel()

	return (
		<div
			className='
				flex flex-col shrink-0
				w-[360px]
				border-r border-border-light
			'
		>
			<div
				className='
					flex
					items-center
					h-12
					px-2.5
					border-b border-border-light
				'
			>
				{x.selected_post ? (
					<div className='h-full'>
						<TextTabs
							items={detail_tab_items.map(item => ({
								key: item.key,
								title: item.title,
								Icon: item.Icon
							}))}
							active={x.detail_tab}
							setActive={(value: DetailTab) => x.setDetailTab(value)}
						></TextTabs>
					</div>
				) : (
					<span className='text-std-400 text-sm'>Loading post</span>
				)}
			</div>
			<div className='min-h-0 flex-1 overflow-hidden'>
				{!x.selected_post ? (
					<div
						className='
							flex
							items-center justify-center
							h-full
							px-6
							text-sm text-std-400
							text-center
						'
					>
						{x.post_loading ? 'Loading post...' : 'Select a post from the list.'}
					</div>
				) : x.detail_tab === 'outline' ? (
					<div className='h-full overflow-y-auto p-2.5'>
						<OutlinePanel></OutlinePanel>
					</div>
				) : x.detail_tab === 'related' ? (
					<RelatedPanel></RelatedPanel>
				) : (
					<SessionPanel></SessionPanel>
				)}
			</div>
		</div>
	)
}

export default observer(Index)

import { observer } from 'mobx-react-lite'

import { TextTabs } from '@/components'

import { useModel } from '../context'
import { for_type_tab_items } from '../utils'
import Header from './Header'
import List from './List'

import type { PostForType } from '../types'

const Index = () => {
	const x = useModel()

	return (
		<div className='h-full overflow-y-auto'>
			<div
				className='
					flex flex-col
					w-full
					min-h-full
					py-5
					page_wrap
				'
			>
				<Header></Header>
				<div className='border-border-light bg-background/70 rounded-[28px] border'>
					<div
						className='
							flex
							items-center justify-between
							gap-3
							px-4 py-3
							border-b border-border-light
						'
					>
						<div className='h-8'>
							<TextTabs
								items={for_type_tab_items.map(item => ({
									key: item.key,
									title: item.title,
									Icon: item.Icon
								}))}
								active={x.for_type}
								setActive={(value: PostForType) => x.setForType(value)}
							></TextTabs>
						</div>
						<div className='text-std-400 text-xs'>
							{x.current_list_state.list.length} loaded
						</div>
					</div>
					<div className='flex flex-col gap-2 p-3'>
						<List></List>
					</div>
				</div>
			</div>
		</div>
	)
}

export default observer(Index)

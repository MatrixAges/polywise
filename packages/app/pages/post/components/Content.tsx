import { Search } from 'lucide-react'
import { observer } from 'mobx-react-lite'

import { Input } from '@/__shadcn__/components/ui/input'
import { Tabs } from '@/components'

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
						<div className='min-w-0 flex-1'>
							<Tabs
								small
								items={for_type_tab_items.map(item => ({
									key: item.key,
									title: item.title,
									Icon: item.Icon
								}))}
								active={x.for_type}
								onClick={value => x.setForType(value as PostForType)}
							></Tabs>
						</div>
						<div className='w-full max-w-[260px]'>
							<div className='relative'>
								<Search
									className='
										absolute
										top-1/2
										left-3
										size-3.5
										text-std-300
										pointer-events-none -translate-y-1/2
									'
								></Search>
								<Input
									className='h-8 rounded-full pl-8 text-sm'
									placeholder={`Search ${x.for_type} articles`}
									value={x.current_search}
									onChange={event => x.setSearch(event.target.value)}
								></Input>
							</div>
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

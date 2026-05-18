import { useState } from 'react'
import { Plus, Search, X } from 'lucide-react'
import { observer } from 'mobx-react-lite'
import { useNavigate } from 'react-router'

import { Input } from '@/__shadcn__/components/ui/input'
import { Tabs } from '@/components'

import { useModel } from '../context'
import { for_type_tab_items } from '../utils'
import List from './List'

import type { PostForType } from '../types'

const Index = () => {
	const x = useModel()
	const navigate = useNavigate()
	const [search_open, setSearchOpen] = useState(() => !!x.current_search)
	const is_search_open = search_open || !!x.current_search

	const closeSearch = () => {
		x.setSearch('')
		setSearchOpen(false)
	}

	return (
		<div className='h-full overflow-y-auto'>
			<div
				className='
					flex flex-col
					w-full
					min-h-full
					pt-0
					page_wrap
				'
			>
				<div
					className='
						flex
						items-center justify-between
						gap-3
						px-4 py-3
					'
				>
					<div className='min-w-0 flex-1'>
						<Tabs
							items={for_type_tab_items.map(item => ({
								key: item.key,
								title: item.title,
								Icon: item.Icon
							}))}
							active={x.for_type}
							onClick={value => x.setForType(value as PostForType)}
						></Tabs>
					</div>
					<div className='flex shrink-0 items-center gap-1.5'>
						{is_search_open ? (
							<div className='relative w-[220px]'>
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
									autoFocus
									className='
										h-8
										pl-8 pr-8
										rounded-full
										text-sm
									'
									placeholder={`Search ${x.for_type} articles`}
									value={x.current_search}
									onChange={event => x.setSearch(event.target.value)}
								></Input>
								<button
									className='
										absolute
										top-1 right-1
										w-6 h-6
										icon_button small
									'
									type='button'
									title='Close search'
									onClick={closeSearch}
								>
									<X className='size-3.5'></X>
								</button>
							</div>
						) : (
							<button
								className='icon_button small'
								type='button'
								title='Search posts'
								onClick={() => setSearchOpen(true)}
							>
								<Search className='size-3.5'></Search>
							</button>
						)}
						<button
							className='icon_button small'
							type='button'
							title='New post'
							onClick={async () => {
								const id = await x.createPost()

								if (id) {
									navigate(`/post/${id}`)
								}
							}}
						>
							<Plus className='size-3.5'></Plus>
						</button>
					</div>
				</div>
				<div className='flex flex-col gap-2 p-3'>
					<List></List>
				</div>
			</div>
		</div>
	)
}

export default observer(Index)

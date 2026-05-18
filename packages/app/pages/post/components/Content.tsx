import { useState } from 'react'
import { Plus, Search, X } from 'lucide-react'
import { observer } from 'mobx-react-lite'
import { useNavigate } from 'react-router'

import { Button } from '@/__shadcn__/components/ui/button'
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
		<div
			className='
				overflow-hidden
				flex flex-col
				w-full h-full
				pt-0
				page_wrap
			'
		>
			<div
				className='
					flex shrink-0
					items-center justify-between
					h-14
					gap-3
				'
			>
				<Tabs
					items={for_type_tab_items.map(item => ({
						key: item.key,
						title: item.title,
						Icon: item.Icon
					}))}
					active={x.for_type}
					onClick={value => x.setForType(value as PostForType)}
				></Tabs>
				<div className='flex shrink-0 items-center gap-3'>
					{is_search_open ? (
						<div className='relative flex w-[150px] items-center'>
							<Search
								className='
									absolute
									top-1/2
									left-2
									size-3.5
									text-std-300
									pointer-events-none -translate-y-1/2
								'
							></Search>
							<Input
								autoFocus
								className='
									h-7
									pl-6.5 pr-8
									rounded-full
									text-sm
								'
								placeholder='Search articles'
								value={x.current_search}
								onChange={event => x.setSearch(event.target.value)}
							></Input>
							<button
								className='
									absolute
									right-0
									w-7 h-7
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
						<Button
							className='h-7 w-7'
							variant='secondary'
							size='xs'
							title='Search posts'
							onClick={() => setSearchOpen(true)}
						>
							<Search className='size-3.5'></Search>
						</Button>
					)}
					<Button
						className='h-7 w-7'
						variant='default'
						size='xs'
						title='New post'
						onClick={async () => {
							const id = await x.createPost()

							if (id) {
								navigate(`/post/${id}`)
							}
						}}
					>
						<Plus className='size-3.5'></Plus>
					</Button>
				</div>
			</div>
			<div className='min-h-0 flex-1 overflow-y-auto'>
				<div className='flex flex-col gap-2'>
					<List></List>
				</div>
			</div>
		</div>
	)
}

export default observer(Index)

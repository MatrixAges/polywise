import { useState } from 'react'
import { Plus, Search, X } from 'lucide-react'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'

import { Button } from '@/__shadcn__/components/ui/button'
import { Input } from '@/__shadcn__/components/ui/input'
import { TextTabs } from '@/components'

import { useModel } from '../context'
import { getForTypeTabItems } from '../utils'

import type { PostListTab } from '../types'

const Index = () => {
	const x = useModel()
	const { t } = useTranslation('post')
	const navigate = useNavigate()
	const [search_open, setSearchOpen] = useState(() => !!x.current_search)
	const is_search_open = search_open || !!x.current_search
	const for_type_tab_items = getForTypeTabItems(t)

	const closeSearch = () => {
		x.setSearch('')
		setSearchOpen(false)
	}

	return (
		<div
			className='
				flex shrink-0
				items-center justify-between
				h-12
				gap-3
			'
		>
			<div className='h-7'>
				<TextTabs
					className='gap-3'
					items={for_type_tab_items.map(item => ({
						key: item.key,
						title: item.title,
						Icon: item.Icon
					}))}
					active={x.active_tab}
					setActive={value => x.setForType(value as PostListTab)}
				></TextTabs>
			</div>
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
								h-6
								pl-6.5 pr-8
								rounded-full
								text-sm
								placeholder:text-xs!
							'
							placeholder={t('list.search_articles')}
							value={x.current_search}
							onChange={event => x.setSearch(event.target.value)}
						></Input>
						<button
							className='
								absolute
								right-0
								w-6 h-6
								icon_button small
							'
							type='button'
							title={t('list.close_search')}
							onClick={closeSearch}
						>
							<X className='size-3.5'></X>
						</button>
					</div>
				) : (
					<Button
						className='h-6 w-6'
						variant='secondary'
						size='xs'
						title={t('list.search_posts')}
						onClick={() => setSearchOpen(true)}
					>
						<Search className='size-3.5'></Search>
					</Button>
				)}
				{x.active_tab !== 'agent' && (
					<Button
						className='h-6 w-6'
						variant='default'
						size='xs'
						title={t('list.new_post')}
						onClick={async () => {
							const id = await x.createPost()

							if (id) {
								navigate(`/post/${id}`)
							}
						}}
					>
						<Plus className='size-3.5'></Plus>
					</Button>
				)}
			</div>
		</div>
	)
}

export default observer(Index)

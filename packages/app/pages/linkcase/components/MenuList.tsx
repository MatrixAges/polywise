import { Loader, TriangleAlert } from 'lucide-react'
import { observer } from 'mobx-react-lite'

import { Button } from '@/__shadcn__/components/ui/button'

import { useModel } from '../context'
import MenuListItem from './MenuListItem'

const Index = () => {
	const x = useModel()

	return (
		<div
			className='
				overflow-y-auto
				flex-1
				min-h-0
				px-2 py-2
			'
			onScroll={x.onMenuScroll}
		>
			<div className='flex flex-col gap-1'>
				{x.items.map((item, index) => (
					<MenuListItem item={item} index={index} key={item.id}></MenuListItem>
				))}
				{(x.has_more || x.loading_more) && (
					<Button
						className='w-full'
						variant='outline'
						size='sm'
						disabled={x.loading || x.loading_more}
						onClick={x.loadMoreList}
					>
						{x.loading_more && <Loader className='size-3 animate-spin'></Loader>}
						{x.loading_more ? 'Loading more' : 'Load more'}
					</Button>
				)}
				{x.loading_more && (
					<div
						className='
							flex
							items-center justify-center
							gap-2
							py-3
							text-xs text-std-300
						'
					>
						<Loader className='size-3 animate-spin'></Loader>
						<span>Loading more</span>
					</div>
				)}
				{!x.loading && x.items.length === 0 && (
					<div
						className='
							flex flex-col
							items-center justify-center
							min-h-[180px]
							gap-2
							rounded-3xl
							text-sm text-std-300
							border border-dashed border-border-light
						'
					>
						<TriangleAlert className='size-4'></TriangleAlert>
						<span>No links found</span>
					</div>
				)}
			</div>
		</div>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()

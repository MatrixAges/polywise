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
			'
			onScroll={x.onMenuScroll}
		>
			<div className='flex flex-col gap-0.5'>
				{x.items.map((item, index) => (
					<MenuListItem item={item} index={index} key={item.id}></MenuListItem>
				))}
				{(x.has_more || x.loading_more) && (
					<div className='px-1.5'>
						<Button
							className='text-std-400 text-xsm! w-full bg-transparent'
							variant='outline'
							size='sm'
							disabled={x.loading || x.loading_more}
							onClick={x.loadMoreList}
						>
							{x.loading_more && <Loader className='size-3 animate-spin'></Loader>}
							{x.loading_more ? 'Loading more' : 'Load more'}
						</Button>
					</div>
				)}
			</div>
		</div>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()

import { observer } from 'mobx-react-lite'

import { useModel } from '../context'

const Index = () => {
	const x = useModel()

	if (x.outline_items.length === 0) {
		return <div className='text-std-400 px-3 py-4 text-sm'>No markdown headings yet.</div>
	}

	return (
		<div className='flex flex-col gap-1.5'>
			{x.outline_items.map(item => (
				<div
					className='
						px-3 py-2
						rounded-lg
						text-sm text-foreground
						hover:bg-secondary
						cursor-pointer
					'
					style={{ paddingLeft: 12 + (item.level - 1) * 14 }}
					onClick={() => x.scrollToOutlineItem(item)}
					key={item.id}
				>
					{item.text}
				</div>
			))}
		</div>
	)
}

export default observer(Index)

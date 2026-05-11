import type { IPropsModalTocItem } from '../../types'

const Index = (props: IPropsModalTocItem) => {
	const { item, onClick } = props
	const { id, level, textContent, itemIndex, isActive, isScrolledOver } = item

	return (
		<div
			className={$cx(
				`
				box-border
				flex
				items-center
				w-full
				toc_item
			`,
				isActive && !isScrolledOver && 'active',
				isScrolledOver && 'scrolled'
			)}
		>
			<span className='signal_wrap items-center'>
				<span className='signal inline-block' style={{ width: (6 - level) * 3 }}></span>
			</span>
			<a
				className='block cursor-pointer truncate'
				href={`#${id}`}
				onClick={e => onClick(e, item.id)}
				data-item-index={itemIndex}
			>
				{textContent}
			</a>
		</div>
	)
}

export default $app.memo(Index)

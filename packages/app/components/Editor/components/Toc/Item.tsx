import type { IPropsModalTocItem } from '../../types'

const Index = (props: IPropsModalTocItem) => {
	const { item, onClick } = props
	const { id, level, textContent, itemIndex, isActive, isScrolledOver } = item

	return (
		<div
			className={$cx(
				'
				flex
				border_box
				toc_item w_100 align_center
			',
				isActive && !isScrolledOver && 'active',
				isScrolledOver && 'scrolled'
			)}
		>
			<span className='signal_wrap align_center'>
				<span className='signal inline_block' style={{ width: (6 - level) * 3 }}></span>
			</span>
			<a
				className='line_clamp_1 clickable'
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

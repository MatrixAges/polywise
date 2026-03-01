import { PanelRight, SlidersHorizontal } from 'lucide-react'

const Index = () => {
	return (
		<div
			className='
				absolute
				right-2
				flex
				items-center
				gap-2
			'
		>
			<button className='icon_button'>
				<SlidersHorizontal></SlidersHorizontal>
			</button>
			<button className='icon_button'>
				<PanelRight></PanelRight>
			</button>
		</div>
	)
}

export default $app.memo(Index)

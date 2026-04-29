import { useDelegate } from '@/hooks'

interface IProps {
	items: Array<string>
	active: string
	setActive: (v: any) => void
}

const Index = (props: IProps) => {
	const { items, active, setActive } = props

	const ref_tab = useDelegate(v => setActive(v), { item_type: 'span' })

	return (
		<div
			className='
				flex
				items-center
				h-full
				gap-1
				pt-px
				text-xsm text-std-400 font-medium
			'
			ref={ref_tab}
		>
			{items.map(item => (
				<span
					className={$cx(
						`
						flex
						items-center
						h-full
						px-1
						border-b border-transparent
						clickable capitalize
					`,
						active === item && 'text-std-800 border-std-black!'
					)}
					data-key={item}
					key={item}
				>
					{item}
				</span>
			))}
		</div>
	)
}

export default $app.memo(Index)

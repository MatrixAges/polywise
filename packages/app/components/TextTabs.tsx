import { useDelegate } from '@/hooks'

type TabItem = string | { key: string; title: string }

interface IProps {
	items: Array<TabItem>
	active: string
	className?: string
	itemClassName?: string
	setActive: (v: any) => void
}

const Index = (props: IProps) => {
	const { items, active, className, itemClassName, setActive } = props

	const ref_tab = useDelegate(v => setActive(v), { item_type: 'span' })

	return (
		<div
			className={$cx(
				`
				flex
				items-center
				h-full
				gap-1
				pt-px
				text-xsm text-std-400 font-medium
			`,
				className
			)}
			ref={ref_tab}
		>
			{items.map(item => {
				const key = typeof item === 'string' ? item : item.key
				const title = typeof item === 'string' ? item : item.title

				return (
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
							active === key && 'text-std-800 border-std-black!',
							itemClassName
						)}
						data-key={key}
						key={key}
					>
						{title}
					</span>
				)
			})}
		</div>
	)
}

export default $app.memo(Index)

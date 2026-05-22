import { observer } from 'mobx-react-lite'

import { useModel } from '../context'

const section_title_class =
	'flex items-center pl-2 text-std-600 text-sm font-semibold leading-none border-l-2 border-std-500'

const Leaderboard = (props: {
	title: string
	items: Array<{
		key: string
		title: string
		subtitle: string
		meta: string
		value: string
		footnote: string
	}>
}) => (
	<div className='border-border-light flex flex-col border'>
		<div
			className='
					px-4 py-3
					text-std-400 text-xs font-medium
					uppercase
					border-b border-border-light
				'
		>
			{props.title}
		</div>
		<div className='flex flex-col'>
			{props.items.length ? (
				props.items.map((item, index) => (
					<div
						className={$cx(
							'
								flex
								items-start justify-between
								gap-3
								px-4 py-3.5
							',
							index !== props.items.length - 1 && 'border-border-light border-b'
						)}
						key={item.key}
					>
						<div className='min-w-0 flex-1'>
							<div className='truncate text-sm font-medium'>{item.title}</div>
							<div className='text-std-300 mt-0.5 truncate text-xs'>{item.subtitle}</div>
							<div className='text-std-300 mt-1 truncate text-xs'>{item.meta}</div>
							<div className='text-std-300 mt-1 text-xs'>{item.footnote}</div>
						</div>
						<div className='shrink-0 text-right'>
							<div className='font-mono text-sm font-semibold'>{item.value}</div>
							<div className='text-std-300 text-xs'>tokens</div>
						</div>
					</div>
				))
			) : (
				<div className='text-std-300 px-4 py-5 text-sm'>No data in this window.</div>
			)}
		</div>
	</div>
)

const Index = () => {
	const x = useModel()

	return (
		<div className='flex flex-col gap-10'>
			<div className='flex flex-col gap-3'>
				<div className={section_title_class}>Agent Overview</div>
				<div
					className='
						grid grid-cols-2
						border border-border-light border-b-0
					'
				>
					{x.agent_overview_items.map(item => (
						<div
							className='
								flex flex-col
								gap-2
								px-4 py-3.5
								border-r border-b border-border-light
								even:border-r-0
							'
							key={item.key}
						>
							<div className='text-std-400 text-xs font-medium uppercase'>{item.title}</div>
							<div className='font-mono text-2xl font-semibold tracking-tight'>
								{item.value}
							</div>
							<div className='text-std-300 text-xs'>{item.desc}</div>
						</div>
					))}
				</div>
			</div>
			<div className='flex flex-col gap-3'>
				<div className={section_title_class}>Activity Surface</div>
				<div
					className='
						grid grid-cols-2
						border border-border-light border-b-0
					'
				>
					{x.agent_activity_items.map(item => (
						<div
							className='
								flex flex-col
								gap-2
								px-4 py-3.5
								border-r border-b border-border-light
								even:border-r-0
							'
							key={item.key}
						>
							<div className='text-std-400 text-xs font-medium uppercase'>{item.title}</div>
							<div className='font-mono text-2xl font-semibold tracking-tight'>
								{item.value}
							</div>
							<div className='text-std-300 text-xs'>{item.desc}</div>
						</div>
					))}
				</div>
			</div>
			<div className='grid grid-cols-1 gap-4 xl:grid-cols-2'>
				<Leaderboard items={x.top_agent_items} title='Top agents' />
				<Leaderboard items={x.top_group_items} title='Top groups' />
			</div>
		</div>
	)
}

export default observer(Index)

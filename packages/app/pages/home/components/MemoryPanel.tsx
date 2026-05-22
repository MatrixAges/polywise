import { observer } from 'mobx-react-lite'

import { useModel } from '../context'

const stat_item_class = 'flex flex-col gap-2 px-4 py-3.5'

const Index = () => {
	const x = useModel()
	const memory = x.data!.memory
	const frozen_total = memory.frozen_node_total + memory.frozen_edge_total
	const memory_health_items = x.memory_health_items
	const memory_depth_items = x.memory_depth_items
	const ops_items = x.ops_items

	return (
		<div className='flex flex-col gap-3'>
			<div
				className='
					flex
					items-center
					pl-2
					text-std-600 text-sm font-semibold leading-none
					border-l-2 border-std-500
				'
			>
				Memory
			</div>
			<div className='text-std-400 text-sm leading-6'>
				Graph size, rewire pressure, and adjacent ops signals from the background memory system.
			</div>
			<div className='flex flex-col'>
				<div
					className='
						grid grid-cols-2
						border border-border-light border-b-0
					'
				>
					<div className={`${stat_item_class}border-border-light border-r border-b`}>
						<div className='text-std-400 text-xs font-medium uppercase'>Nodes</div>
						<div className='font-mono text-2xl font-semibold tracking-tight'>
							{x.node_total_label}
						</div>
						<div className='text-std-300 text-xs'>{memory.frozen_node_total} frozen</div>
					</div>
					<div className={`${stat_item_class}border-border-light border-b`}>
						<div className='text-std-400 text-xs font-medium uppercase'>Edges</div>
						<div className='font-mono text-2xl font-semibold tracking-tight'>
							{x.edge_total_label}
						</div>
						<div className='text-std-300 text-xs'>{memory.frozen_edge_total} frozen</div>
					</div>
					<div className={`${stat_item_class}border-border-light border-r border-b`}>
						<div className='text-std-400 text-xs font-medium uppercase'>Weekly Rewires</div>
						<div className='font-mono text-2xl font-semibold tracking-tight'>
							{memory.rewire_event_week.toLocaleString('en-US')}
						</div>
						<div className='text-std-300 text-xs'>
							{memory.rewire_event_total.toLocaleString('en-US')} total
						</div>
					</div>
					<div className={`${stat_item_class}border-border-light border-r border-b`}>
						<div className='text-std-400 text-xs font-medium uppercase'>Frozen Graph</div>
						<div className='font-mono text-2xl font-semibold tracking-tight'>
							{frozen_total.toLocaleString('en-US')}
						</div>
						<div className='text-std-300 text-xs'>Nodes and edges combined</div>
					</div>
				</div>

				<div
					className='
						grid
						border border-border-light border-t-0 border-b-0
						md:grid-cols-3
					'
				>
					{memory_health_items.map((item, index) => (
						<div
							className={`${stat_item_class}border-border-light border-b${
								index < memory_health_items.length - 1 ? 'md:border-r' : ''
							}`}
							key={item.key}
						>
							<div className='text-std-400 text-xs font-medium uppercase'>{item.title}</div>
							<div className='font-mono text-2xl font-semibold tracking-tight'>
								{item.value}
							</div>
							{item.desc ? <div className='text-std-300 text-xs'>{item.desc}</div> : null}
						</div>
					))}
				</div>

				<div
					className='
						grid
						border border-border-light border-t-0 border-b-0
						md:grid-cols-3
					'
				>
					{memory_depth_items.map((item, index) => (
						<div
							className={`${stat_item_class}border-border-light border-b${
								index < memory_depth_items.length - 1 ? 'md:border-r' : ''
							}`}
							key={item.key}
						>
							<div className='text-std-400 text-xs font-medium uppercase'>{item.title}</div>
							<div className='font-mono text-2xl font-semibold tracking-tight'>
								{item.value}
							</div>
							{item.desc ? <div className='text-std-300 text-xs'>{item.desc}</div> : null}
						</div>
					))}
				</div>

				<div
					className='
						px-4 py-3.5
						border border-border-light border-t-0
					'
				>
					<div className='text-std-400 text-xs font-medium uppercase'>Ops Surface</div>
				</div>
				<div
					className='
						grid
						border border-border-light border-t-0
						md:grid-cols-4
					'
				>
					{ops_items.map((item, index) => (
						<div
							className={`${stat_item_class}border-border-light border-b md:border-b-0${
								index < ops_items.length - 1 ? 'md:border-r' : ''
							}`}
							key={item.key}
						>
							<div className='text-std-400 text-xs font-medium uppercase'>{item.title}</div>
							<div className='font-mono text-2xl font-semibold tracking-tight'>
								{item.value}
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	)
}

export default observer(Index)

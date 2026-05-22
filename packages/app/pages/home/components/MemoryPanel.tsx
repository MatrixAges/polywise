import { Database, Workflow } from 'lucide-react'
import { observer } from 'mobx-react-lite'

import { useModel } from '../context'
import SectionCard from './SectionCard'

const Index = () => {
	const x = useModel()
	const memory = x.data!.memory
	const frozen_total = memory.frozen_node_total + memory.frozen_edge_total

	return (
		<SectionCard
			title='Memory'
			desc='Graph size, rewrite pressure, and adjacent ops signals from the background memory system.'
		>
			<div className='grid gap-6'>
				<div className='grid grid-cols-2 gap-3'>
					<div className='border-border/70 rounded-2xl border p-4'>
						<div
							className='
								flex
								items-center
								gap-2
								text-sm font-medium
							'
						>
							<Workflow className='size-4 text-rose-600' />
							<span>Nodes</span>
						</div>
						<div className='mt-3 text-2xl font-semibold tracking-tight'>
							{x.node_total_label}
						</div>
						<div className='text-std-400 mt-2 text-sm'>{memory.frozen_node_total} frozen</div>
					</div>
					<div className='border-border/70 rounded-2xl border p-4'>
						<div
							className='
								flex
								items-center
								gap-2
								text-sm font-medium
							'
						>
							<Workflow className='size-4 text-rose-600' />
							<span>Edges</span>
						</div>
						<div className='mt-3 text-2xl font-semibold tracking-tight'>
							{x.edge_total_label}
						</div>
						<div className='text-std-400 mt-2 text-sm'>{memory.frozen_edge_total} frozen</div>
					</div>
					<div className='border-border/70 rounded-2xl border p-4'>
						<div
							className='
								flex
								items-center
								gap-2
								text-sm font-medium
							'
						>
							<Workflow className='size-4 text-rose-600' />
							<span>Weekly rewires</span>
						</div>
						<div className='mt-3 text-2xl font-semibold tracking-tight'>
							{memory.rewire_event_week.toLocaleString('en-US')}
						</div>
						<div className='text-std-400 mt-2 text-sm'>
							{memory.rewire_event_total.toLocaleString('en-US')} total
						</div>
					</div>
					<div className='border-border/70 rounded-2xl border p-4'>
						<div
							className='
								flex
								items-center
								gap-2
								text-sm font-medium
							'
						>
							<Workflow className='size-4 text-rose-600' />
							<span>Frozen graph</span>
						</div>
						<div className='mt-3 text-2xl font-semibold tracking-tight'>
							{frozen_total.toLocaleString('en-US')}
						</div>
						<div className='text-std-400 mt-2 text-sm'>Nodes and edges combined</div>
					</div>
				</div>

				<div className='grid gap-3 sm:grid-cols-3'>
					{x.memory_health_items.map(item => (
						<div className='border-border/70 rounded-2xl border p-4' key={item.key}>
							<div className='text-std-400 text-[11px] tracking-[0.18em] uppercase'>
								{item.title}
							</div>
							<div className='mt-2 text-xl font-semibold tracking-tight'>{item.value}</div>
							{item.desc ? (
								<div className='text-std-400 mt-2 text-sm leading-5'>{item.desc}</div>
							) : null}
						</div>
					))}
				</div>

				<div className='grid gap-3 sm:grid-cols-3'>
					{x.memory_depth_items.map(item => (
						<div className='border-border/70 rounded-2xl border p-4' key={item.key}>
							<div className='text-std-400 text-[11px] tracking-[0.18em] uppercase'>
								{item.title}
							</div>
							<div className='mt-2 text-xl font-semibold tracking-tight'>{item.value}</div>
							{item.desc ? (
								<div className='text-std-400 mt-2 text-sm leading-5'>{item.desc}</div>
							) : null}
						</div>
					))}
				</div>

				<div>
					<div
						className='
							flex
							items-center
							gap-2
							text-sm font-medium
						'
					>
						<Database className='size-4 text-indigo-600' />
						<span>Ops surface</span>
					</div>
					<div className='mt-3 grid gap-3 sm:grid-cols-3'>
						{x.ops_items.map(item => (
							<div className='border-border/70 rounded-2xl border p-4' key={item.key}>
								<div className='text-std-400 text-[11px] tracking-[0.18em] uppercase'>
									{item.title}
								</div>
								<div className='mt-2 text-xl font-semibold tracking-tight'>
									{item.value}
								</div>
							</div>
						))}
					</div>
				</div>
			</div>
		</SectionCard>
	)
}

export default observer(Index)

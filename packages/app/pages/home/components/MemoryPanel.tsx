import { Database, Workflow } from 'lucide-react'
import { observer } from 'mobx-react-lite'

import { useModel } from '../context'
import SectionCard from './SectionCard'

const Index = () => {
	const x = useModel()
	const memory = x.data!.memory

	return (
		<SectionCard title='Memory and Graph' desc='rewire 背景循环当前能看到的知识结构面。'>
			<div className='grid gap-3'>
				<div className='bg-secondary/60 rounded-3xl p-4'>
					<div
						className='
							flex
							items-center
							gap-2
							text-sm font-medium
						'
					>
						<Workflow className='text-rose-600' />
						<span>Graph Surface</span>
					</div>
					<div
						className='
							grid grid-cols-2
							gap-3
							mt-3
							text-sm
						'
					>
						<div className='bg-background/80 rounded-2xl p-3'>
							<div className='text-std-400 text-xs tracking-[0.16em] uppercase'>Nodes</div>
							<div className='mt-2 text-2xl font-semibold'>{x.node_total_label}</div>
							<div className='text-std-400 mt-1 text-xs'>
								{memory.frozen_node_total} frozen
							</div>
						</div>
						<div className='bg-background/80 rounded-2xl p-3'>
							<div className='text-std-400 text-xs tracking-[0.16em] uppercase'>Edges</div>
							<div className='mt-2 text-2xl font-semibold'>{x.edge_total_label}</div>
							<div className='text-std-400 mt-1 text-xs'>
								{memory.frozen_edge_total} frozen
							</div>
						</div>
					</div>
					<div className='text-std-400 mt-3 text-sm'>
						{memory.rewire_event_week} rewire events in the last 7 days,{' '}
						{memory.rewire_event_total} total.
					</div>
				</div>

				<div className='bg-secondary/60 rounded-3xl p-4'>
					<div
						className='
							flex
							items-center
							gap-2
							text-sm font-medium
						'
					>
						<Database className='text-indigo-600' />
						<span>Ops Surface</span>
					</div>
					<div
						className='
							flex flex-col
							gap-2
							mt-3
							text-sm
						'
					>
						{x.ops_items.map(item => (
							<div
								className='
									flex
									items-center justify-between
									px-3 py-2
									rounded-2xl
									bg-background/80
								'
								key={item.key}
							>
								<span>{item.title}</span>
								<span className='font-semibold'>{item.value}</span>
							</div>
						))}
					</div>
				</div>
			</div>
		</SectionCard>
	)
}

export default observer(Index)

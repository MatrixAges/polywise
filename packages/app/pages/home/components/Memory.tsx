import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'

import { useModel } from '../context'

const stat_item_class = 'flex flex-col gap-2 px-4 py-3.5'

const Index = () => {
	const x = useModel()
	const { t } = useTranslation('home')
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
				{t('sections.memory')}
			</div>
			<div className='text-std-400 text-sm leading-6'>{t('memory.desc')}</div>
			<div className='flex flex-col'>
				<div
					className='
						grid grid-cols-2
						border border-border-light border-b-0
					'
				>
					<div className={$cx(stat_item_class, 'border-border-light border-r border-b')}>
						<div className='text-std-400 text-xs font-medium uppercase'>
							{t('memory.nodes')}
						</div>
						<div className='font-mono text-2xl font-semibold tracking-tight'>
							{x.node_total_label}
						</div>
						<div className='text-std-300 text-xs'>
							{memory.frozen_node_total} {t('memory.frozen')}
						</div>
					</div>
					<div className={$cx(stat_item_class, 'border-border-light border-b')}>
						<div className='text-std-400 text-xs font-medium uppercase'>
							{t('memory.edges')}
						</div>
						<div className='font-mono text-2xl font-semibold tracking-tight'>
							{x.edge_total_label}
						</div>
						<div className='text-std-300 text-xs'>
							{memory.frozen_edge_total} {t('memory.frozen')}
						</div>
					</div>
					<div className={$cx(stat_item_class, 'border-border-light border-r border-b')}>
						<div className='text-std-400 text-xs font-medium uppercase'>
							{x.stats_period_adjective} Rewires
						</div>
						<div className='font-mono text-2xl font-semibold tracking-tight'>
							{memory.rewire_event_week.toLocaleString(navigator.language)}
						</div>
						<div className='text-std-300 text-xs'>
							{memory.rewire_event_total.toLocaleString(navigator.language)}{' '}
							{t('memory.total')}
						</div>
					</div>
					<div className={$cx(stat_item_class, 'border-border-light border-r border-b')}>
						<div className='text-std-400 text-xs font-medium uppercase'>
							{t('memory.frozen_graph')}
						</div>
						<div className='font-mono text-2xl font-semibold tracking-tight'>
							{frozen_total.toLocaleString(navigator.language)}
						</div>
						<div className='text-std-300 text-xs'>{t('memory.nodes_and_edges_combined')}</div>
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
							className={$cx(
								stat_item_class,
								'border-border-light border-b',
								index < memory_health_items.length - 1 && 'md:border-r'
							)}
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
							className={$cx(
								stat_item_class,
								'border-border-light border-b',
								index < memory_depth_items.length - 1 && 'md:border-r'
							)}
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
					<div className='text-std-400 text-xs font-medium uppercase'>
						{t('memory.ops_surface')}
					</div>
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
							className={$cx(
								stat_item_class,
								'border-border-light border-b md:border-b-0',
								index < ops_items.length - 1 && 'md:border-r'
							)}
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

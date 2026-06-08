import { ExternalLink, RefreshCw, Sparkles } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/__shadcn__/components/ui/button'
import { getAppRouteHref } from '@/utils'

import { getPreviewText } from './graph'

import type { AgentGraphNode, AgentGraphResponse } from '../../types'

interface IProps {
	graph_data: AgentGraphResponse | null
	selected_graph_node: AgentGraphNode | null
	graph_loading: boolean
	graph_expanding: boolean
	on_refresh: () => void
	on_expand: () => void
}

const renderMetricValue = (value: number) => {
	return value > 999 ? `${(value / 1000).toFixed(1)}k` : String(value)
}

const Index = (props: IProps) => {
	const { graph_data, selected_graph_node, graph_loading, graph_expanding, on_refresh, on_expand } = props
	const { t } = useTranslation('agent')
	const selected_node = graph_data?.selected_node ?? null
	const can_expand = Boolean(selected_node && selected_node.hidden_neighbor_count > 0 && !graph_loading)

	return (
		<div
			className='
				flex flex-col
				w-full
				gap-4
				p-4
				rounded-[28px]
				bg-white/92
				border border-border-light
				xl:w-[340px]
			'
		>
			<div className='flex items-start justify-between gap-3'>
				<div className='space-y-1'>
					<div className='text-std-950 text-sm font-semibold'>
						{t('graph_panel.title', { ns: 'agent' })}
					</div>
					<div className='text-std-400 text-xs leading-5'>
						{t('graph_panel.desc', { ns: 'agent' })}
					</div>
				</div>
				<Button variant='outline' size='xs' onClick={on_refresh} disabled={graph_loading}>
					<RefreshCw className={$cx('size-3.5', graph_loading && 'animate-spin')}></RefreshCw>
					<span>{t('graph_panel.refresh', { ns: 'agent' })}</span>
				</Button>
			</div>
			<div className='grid grid-cols-2 gap-2'>
				<div className='bg-secondary/55 rounded-2xl px-3 py-2'>
					<div className='text-std-400 text-[11px]'>
						{t('graph_panel.visible_nodes', { ns: 'agent' })}
					</div>
					<div className='text-std-950 mt-1 text-sm font-semibold'>
						{renderMetricValue(graph_data?.nodes.length ?? 0)} /{' '}
						{renderMetricValue(graph_data?.total_node_count ?? 0)}
					</div>
				</div>
				<div className='bg-secondary/55 rounded-2xl px-3 py-2'>
					<div className='text-std-400 text-[11px]'>
						{t('graph_panel.visible_edges', { ns: 'agent' })}
					</div>
					<div className='text-std-950 mt-1 text-sm font-semibold'>
						{renderMetricValue(graph_data?.edges.length ?? 0)} /{' '}
						{renderMetricValue(graph_data?.total_edge_count ?? 0)}
					</div>
				</div>
			</div>
			{selected_graph_node && selected_node ? (
				<>
					<div
						className='
							p-4
							rounded-[24px]
							bg-secondary/35
							border border-border-light
						'
					>
						<div className='flex items-start justify-between gap-3'>
							<div className='space-y-1'>
								<div className='text-std-950 text-base font-semibold'>
									{selected_graph_node.name}
								</div>
								<div className='text-std-400 text-xs'>
									{t('graph_panel.weight', { ns: 'agent' })}:{' '}
									{renderMetricValue(selected_graph_node.active_times)}
								</div>
							</div>
							<Button
								variant='default'
								size='xs'
								onClick={on_expand}
								disabled={!can_expand || graph_expanding}
							>
								<Sparkles className='size-3.5'></Sparkles>
								<span>
									{graph_expanding
										? t('graph_panel.expanding', { ns: 'agent' })
										: t('graph_panel.expand', { ns: 'agent' })}
								</span>
							</Button>
						</div>
						<div className='mt-3 grid grid-cols-3 gap-2'>
							<div className='rounded-2xl bg-white/80 px-3 py-2'>
								<div className='text-std-400 text-[11px]'>
									{t('graph_panel.relations', { ns: 'agent' })}
								</div>
								<div className='text-std-950 mt-1 text-sm font-semibold'>
									{renderMetricValue(selected_graph_node.degree)}
								</div>
							</div>
							<div className='rounded-2xl bg-white/80 px-3 py-2'>
								<div className='text-std-400 text-[11px]'>
									{t('graph_panel.articles', { ns: 'agent' })}
								</div>
								<div className='text-std-950 mt-1 text-sm font-semibold'>
									{renderMetricValue(selected_graph_node.article_count)}
								</div>
							</div>
							<div className='rounded-2xl bg-white/80 px-3 py-2'>
								<div className='text-std-400 text-[11px]'>
									{t('graph_panel.chunks', { ns: 'agent' })}
								</div>
								<div className='text-std-950 mt-1 text-sm font-semibold'>
									{renderMetricValue(selected_graph_node.chunk_count)}
								</div>
							</div>
						</div>
						<div className='text-std-400 mt-3 text-xs'>
							{selected_node.hidden_neighbor_count > 0
								? t('graph_panel.hidden_neighbors', {
										ns: 'agent',
										count: selected_node.hidden_neighbor_count
									})
								: t('graph_panel.no_more_neighbors', { ns: 'agent' })}
						</div>
					</div>
					<div className='space-y-2'>
						<div className='text-std-900 text-sm font-semibold'>
							{t('graph_panel.related_articles', { ns: 'agent' })}
						</div>
						<div
							className='
								overflow-y-auto
								flex flex-col
								max-h-[220px]
								gap-2
								pr-1
							'
						>
							{selected_node.articles.length > 0 ? (
								selected_node.articles.map(article_item => (
									<a
										key={article_item.id}
										className='
											px-3 py-3
											rounded-2xl
											bg-white
											border border-border-light
											transition-colors
											group
											hover:border-std-300 hover:bg-secondary/30
										'
										href={getAppRouteHref(`/article/${article_item.id}`)}
									>
										<div className='flex items-start justify-between gap-3'>
											<div className='text-std-950 text-sm font-medium'>
												{article_item.title ||
													t('content.untitled_article', {
														ns: 'agent'
													})}
											</div>
											<ExternalLink
												className='
													shrink-0
													size-3.5
													text-std-300
													transition-colors
													group-hover:text-std-600
												'
											></ExternalLink>
										</div>
										<div className='text-std-500 mt-2 text-xs leading-5'>
											{getPreviewText(article_item.content)}
										</div>
									</a>
								))
							) : (
								<div
									className='
										px-3 py-4
										rounded-2xl
										text-sm text-std-400
										border border-dashed border-border-light
									'
								>
									{t('graph_panel.no_articles', { ns: 'agent' })}
								</div>
							)}
						</div>
					</div>
					<div className='space-y-2'>
						<div className='text-std-900 text-sm font-semibold'>
							{t('graph_panel.related_chunks', { ns: 'agent' })}
						</div>
						<div
							className='
								overflow-y-auto
								flex flex-col
								max-h-[260px]
								gap-2
								pr-1
							'
						>
							{selected_node.chunks.length > 0 ? (
								selected_node.chunks.map(chunk_item => (
									<div
										key={chunk_item.id}
										className='
											px-3 py-3
											rounded-2xl
											bg-white
											border border-border-light
										'
									>
										<div className='text-std-700 text-xs'>
											{chunk_item.article_title ||
												t('content.untitled_article', { ns: 'agent' })}
										</div>
										<div className='text-std-950 mt-2 text-sm leading-6'>
											{getPreviewText(chunk_item.content, 180)}
										</div>
									</div>
								))
							) : (
								<div
									className='
										px-3 py-4
										rounded-2xl
										text-sm text-std-400
										border border-dashed border-border-light
									'
								>
									{t('graph_panel.no_chunks', { ns: 'agent' })}
								</div>
							)}
						</div>
					</div>
				</>
			) : (
				<div
					className='
						px-4 py-6
						rounded-2xl
						text-sm text-std-400
						border border-dashed border-border-light
					'
				>
					{t('graph_panel.select_node', { ns: 'agent' })}
				</div>
			)}
		</div>
	)
}

export default $app.memo(Index)

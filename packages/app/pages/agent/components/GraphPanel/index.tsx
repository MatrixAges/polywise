import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'

import { useModel } from '../../context'
import GraphCanvas from './GraphCanvas'
import GraphSidebar from './GraphSidebar'

import type { AgentItem } from '../../types'

interface IProps {
	agent: AgentItem
}

const Index = (props: IProps) => {
	const { agent } = props
	const { t } = useTranslation('agent')
	const x = useModel()
	const graph_data = x.graph_data
	const selected_graph_node =
		graph_data?.nodes.find(node_item => node_item.id === graph_data.selected_node_id) ?? null
	const props_canvas = {
		nodes: graph_data?.nodes ?? [],
		edges: graph_data?.edges ?? [],
		selected_node_id: graph_data?.selected_node_id ?? '',
		graph_loading: x.graph_loading,
		on_select_node: x.selectGraphNode
	}
	const props_sidebar = {
		graph_data,
		selected_graph_node,
		graph_loading: x.graph_loading,
		graph_expanding: x.graph_expanding,
		on_refresh: () => void x.refreshGraph(),
		on_expand: x.expandGraphNode
	}

	return (
		<div
			className='
				flex flex-col
				h-full
				min-h-0
				gap-4
				py-5
				xl:flex-row
				page_wrap
			'
		>
			<div
				className='
					flex flex-1 flex-col
					min-w-0 min-h-[420px]
					gap-3
				'
			>
				<div className='space-y-1 px-1'>
					<div className='text-std-950 text-sm font-semibold'>
						{t('detail.graph', { ns: 'agent' })}
					</div>
					<div className='text-std-400 text-xs leading-5'>
						{agent.name
							? `${agent.name} · ${t('graph_panel.desc', { ns: 'agent' })}`
							: t('graph_panel.desc', { ns: 'agent' })}
					</div>
				</div>
				<GraphCanvas {...props_canvas}></GraphCanvas>
			</div>
			<GraphSidebar {...props_sidebar}></GraphSidebar>
		</div>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()

import { observer } from 'mobx-react-lite'

import { useModel } from '../../context'
import GraphCanvas from './GraphCanvas'
import GraphSidebar from './GraphSidebar'

const Index = () => {
	const x = useModel()
	const graph_data = x.graph_data
	const selected_graph_node =
		graph_data?.nodes.find(node_item => node_item.id === graph_data.selected_node_id) ?? null
	const props_canvas = {
		nodes: graph_data?.nodes ?? [],
		edges: graph_data?.edges ?? [],
		selected_node_id: graph_data?.selected_node_id ?? '',
		graph_loading: x.graph_loading,
		graph_expanding: x.graph_expanding,
		can_expand_graph:
			Boolean(graph_data?.selected_node && graph_data.selected_node.hidden_neighbor_count > 0) &&
			!x.graph_loading &&
			!x.graph_expanding,
		on_select_node: x.selectGraphNode,
		on_expand_graph: x.expandGraphNode
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
				overflow-hidden
				flex flex-row
				h-full
				min-w-0 min-h-0
			'
		>
			<div
				className='
					flex flex-1 flex-col
					min-w-0 min-h-0
				'
			>
				<GraphCanvas {...props_canvas}></GraphCanvas>
			</div>
			<GraphSidebar {...props_sidebar}></GraphSidebar>
		</div>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()

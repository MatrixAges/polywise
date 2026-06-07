export default {
	tabs: {
		stats: 'Stats',
		agent: 'Agent',
		memory: 'Memory',
		report: 'Report'
	},
	period: {
		title: {
			day: 'Today',
			week: 'This week',
			month: 'Last 30 days',
			year: 'Last 365 days',
			total: 'All time'
		}
	},
	sections: {
		trending: 'Trending',
		report: 'Report',
		memory: 'Memory',
		agent: 'Agent Overview',
		activity_surface: 'Activity Surface',
		top_agents: 'Top Agents',
		top_groups: 'Top Groups',
		pipeline_ready: 'Pipeline Ready',
		token_usage: 'Token Usage',
		content_review: 'Content Review'
	},
	common: {
		tokens: 'tokens',
		no_data: 'No data in this window.',
		total: 'Total',
		documents: 'Documents',
		articles: 'Articles',
		links: 'Links',
		posts: 'Posts',
		top_models: 'Top models',
		providers: 'Providers',
		less: 'Less',
		more: 'More',
		activities_summary: '{{count}} activities in the {{summary}}'
	},
	memory: {
		desc: 'Graph size, rewire pressure, and adjacent ops signals from the background memory system.',
		nodes: 'Nodes',
		edges: 'Edges',
		frozen: 'frozen',
		total: 'total',
		frozen_graph: 'Frozen Graph',
		nodes_and_edges_combined: 'Nodes and edges combined',
		ops_surface: 'Ops Surface'
	},
	trending: {
		token_throughput: 'Token throughput',
		workspace_activity: 'Workspace Activity'
	},
	report: {
		runtime_status: 'Runtime Status',
		updated: 'Updated {{value}}',
		loading: 'Loading report content...',
		empty: 'No report generated for this window yet. Use the `Report` button in the header to generate one in the background.'
	}
} as const

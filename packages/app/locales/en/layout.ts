export default {
	nav: {
		home: 'home',
		session: 'session',
		agent: 'agent',
		linkcase: 'linkcase',
		post: 'post'
	},
	header: {
		status: 'Status',
		workspaces: 'Workspaces'
	},
	panel: {
		session: 'Session',
		bookmark: 'Bookmark',
		pipeline: 'Pipeline',
		notification: 'Notification',
		actions: 'Actions',
		reset: 'Reset',
		collapse: 'Collapse',
		loading_notifications: 'Loading notifications...',
		empty_notifications: 'No notifications.'
	},
	sessions_status: {
		title: 'Active Sessions',
		desc: 'A panel for quickly viewing dynamic session changes',
		unread: 'Unread',
		running: 'Running',
		error: 'Error',
		empty: 'No sessions',
		not_selected: 'No session selected'
	}
} as const

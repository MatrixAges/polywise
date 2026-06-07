export default {
	tab: {
		wiki: 'wiki',
		memory: 'memory',
		user: 'user',
		agent: 'agent',
		outline: 'Outline',
		related: 'Related',
		project: 'Project'
	},
	list: {
		search_articles: 'Search articles',
		close_search: 'Close search',
		search_posts: 'Search posts',
		new_post: 'New post',
		no_posts: 'No posts yet.',
		untitled_post: 'Untitled post',
		empty_content: 'Empty content',
		related: '{{count}} related',
		load_more: 'Load more',
		extract: 'Extract',
		reextract: 'Re-extract',
		remove: 'Remove'
	},
	detail: {
		untitled_post: 'Untitled post',
		toggle_session_panel: 'Toggle session panel',
		updated: 'Updated {{value}}',
		unsaved_changes: 'Unsaved changes',
		saved: 'Saved',
		characters: '{{count}} characters',
		loading_post: 'Loading post',
		loading_post_detail: 'Loading post...',
		select_post: 'Select a post from the list.',
		not_found: 'Post not found.',
		back_to_posts: 'Back to posts',
		add_reference: 'Add Reference',
		search_related: 'Search article to relate',
		searching: 'Searching...',
		no_matches: 'No matches.',
		loading_related: 'Loading related articles...',
		no_related: 'No related articles.',
		no_headings: 'No markdown headings yet.',
		no_related_projects: 'No related projects.',
		no_available_projects: 'No available projects.',
		add: 'Add',
		close: 'Close',
		create_session: 'Create session',
		related_project_hint: 'Related project files will be used as first-source search results',
		loading_related_projects: 'Loading related projects...',
		add_related_project: 'Add Related Project',
		add_related_project_desc:
			'Select one or more projects. Their files become first-source search inputs for this post.',
		search_projects: 'Search projects',
		loading_projects: 'Loading projects...',
		create_session_desc: 'Create a dedicated post session for AI-assisted writing.'
	},
	toast: {
		saved: 'Post saved.',
		post_removed: 'Post removed.',
		extract_queued: 'Extract queued.',
		extract_completed: 'Extract completed.'
	},
	confirm: {
		delete_post: 'Delete post "{{title}}"?'
	}
} as const

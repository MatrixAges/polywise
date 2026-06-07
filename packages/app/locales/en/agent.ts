export default {
	detail: {
		prompt: 'How agent run',
		soul: "What's in agent's mind",
		identity: 'Who agent is',
		memory: 'Core memory',
		select_agent: 'Select an agent',
		remove_title: 'Remove Agent',
		remove_desc: 'Confirm remove this agent?',
		frozen: 'Frozen',
		locked: 'Locked',
		writable: 'Writable',
		exporting: 'Exporting...',
		export: 'Export'
	},
	skills: {
		placeholder: 'Search and select skills for agent',
		empty: 'No skills found.',
		log_empty: 'No skill call logs for this date.'
	},
	info: {
		role_placeholder: 'Agent role',
		description_placeholder: 'Add a short description for this agent'
	},
	create: {
		auto: 'Auto',
		input: 'Input',
		title: 'Create Agent',
		auto_desc:
			"Describe this agent's purpose in one sentence. The system will generate its role, prompt, soul, identity, and memory from that sentence.",
		input_desc:
			'Enter the basic agent info manually. Name, role, and description are set here, and the remaining fields stay empty.',
		purpose_placeholder: 'Example: Break complex product requests into clear execution plans',
		role_hint: 'Role will be generated and kept within 20 characters.',
		name_placeholder: 'Agent name',
		role_placeholder: 'Role, e.g. Product Lead',
		role_desc: 'Required. Keep it under 20 characters; fewer than two words is recommended.',
		description_placeholder: 'Short description',
		cancel: 'Cancel',
		create: 'Create',
		creating: 'Creating...'
	},
	content: {
		loading_articles: 'Loading articles...',
		empty_manageable: 'No private articles yet.',
		empty_readonly: 'No private articles.',
		untitled_article: 'Untitled article',
		load_more: 'Load more',
		loading: 'Loading...',
		private: 'Private',
		related: 'Related'
	},
	related_articles: {
		title: 'Related Articles',
		search_placeholder: 'Search article to relate',
		searching: 'Searching...',
		no_matches: 'No matches.',
		untitled_article: 'Untitled article',
		empty_content: 'Empty content',
		relate: 'Relate',
		loading: 'Loading related articles...',
		empty: 'No related articles.',
		load_more: 'Load more',
		close: 'Close'
	},
	import: {
		title: 'Import Agent',
		choose_dir: 'Choose a directory path',
		fetch: 'Fetch',
		select_file: 'Select a .papk file from the tree',
		supported: 'Only `.papk` files exported from Agent Export are supported.',
		cancel: 'Cancel',
		importing: 'Importing...',
		import: 'Import'
	},
	private_article: {
		title: 'New article',
		untitled: 'Untitled article',
		characters: '{{count}} characters',
		cancel: 'Cancel',
		creating: 'Creating...',
		create: 'Create'
	},
	tools: {
		placeholder: 'Search and select custom tools for agent',
		empty: 'No tools found.',
		log_empty: 'No tool call logs for this date.'
	}
} as const

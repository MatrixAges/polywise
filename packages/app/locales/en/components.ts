export default {
	session: {
		empty_title: 'New Beginning',
		sources: 'Sources',
		edit_file_tool: 'edit_file_tool',
		no_changes: 'No changes',
		drawer: {
			title: 'Session Context',
			desc: 'Current session state and env'
		},
		input: {
			placeholder: 'What needs to be done?',
			effort: 'Effort',
			mode: 'Mode',
			audit_mode: 'Audit Mode',
			submit_mode: 'Submit Mode',
			clear: 'Clear',
			unarchive: 'Unarchive',
			context: 'Context',
			scroll_to_bottom: 'Scroll to bottom',
			archive: 'Archive'
		},
		mention: {
			type_to_search: 'Type to search',
			loading: 'Loading...',
			no_matches: 'No matches found.',
			agent: 'Agent',
			no_description: 'No description',
			tool: 'Tool',
			remote_mcp: 'Remote MCP',
			local_mcp: 'Local MCP'
		},
		permission: {
			title: 'Permission Request',
			tool: 'Tool',
			action: 'Action',
			path: 'Path',
			deny: 'Deny',
			allow: 'Allow'
		},
		question: {
			label: 'question',
			multiple: 'Multiple',
			placeholder: 'Type your answer...',
			submit: 'Submit'
		},
		context: {
			intent: 'Intent',
			context: 'Context',
			tasks: 'Tasks',
			files: 'Files',
			constraints: 'Constraints',
			learned: 'Learned',
			blockers: 'Blockers'
		},
		message: {
			delete_message: 'Delete message',
			saved: 'Saved',
			saving_wiki: 'Saving wiki',
			save_wiki_article: 'Save as wiki article',
			failed_save_wiki: 'Failed to save wiki article.',
			copied: 'Copied',
			copy_message: 'Copy message',
			worked_for: 'Worked for {{duration}}',
			used_tools: 'Used tools',
			explored: 'Explored {{items}}',
			ran: 'Ran {{items}}',
			made: 'Made {{items}}',
			used: 'Used {{items}}',
			file_one: '{{count}} file',
			file_other: '{{count}} files',
			search_one: '{{count}} search',
			search_other: '{{count}} searches',
			list_one: '{{count}} list',
			list_other: '{{count}} lists',
			fetch_one: '{{count}} fetch',
			fetch_other: '{{count}} fetches',
			command_one: '{{count}} command',
			command_other: '{{count}} commands',
			edit_one: '{{count}} edit',
			edit_other: '{{count}} edits',
			tool_one: '{{count}} tool',
			tool_other: '{{count}} tools'
		}
	}
} as const

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
			submit_enter: 'Enter Mode',
			submit_ctrl_enter: 'Ctrl+Enter Mode',
			mode_normal: 'Normal',
			mode_plan: 'Plan',
			mode_plan_exec: 'Plan-Exec',
			audit_limited: 'Limited',
			audit_auto: 'Auto',
			audit_full: 'Full Access',
			effort_default: 'Default',
			effort_low: 'Low',
			effort_medium: 'Medium',
			effort_high: 'High',
			effort_xhigh: 'XHigh',
			clear: 'Clear',
			unarchive: 'Unarchive',
			context: 'Context',
			scroll_to_bottom: 'Scroll to bottom',
			archive: 'Archive'
		},
		mention: {
			tools_mcps_skills: 'Tools, MCPs & Skills',
			mentions: 'Mentions',
			type_to_search: 'Type to search',
			loading: 'Loading...',
			no_matches: 'No matches found.',
			agent: 'Agent',
			no_description: 'No description',
			tool: 'Tool',
			remote_mcp: 'Remote MCP',
			local_mcp: 'Local MCP'
		},
		skill: {
			system: 'System',
			personal: 'Personal',
			creator_label: 'skill-creator',
			creator_desc: 'Create or update reusable local skills from repeated workflows or failure patterns.',
			installer_label: 'skill-installer',
			installer_desc:
				'Install a curated skill or a skill from another repository into the local skills directory.'
		},
		permission: {
			title: 'Permission Request',
			tool: 'Tool',
			action: 'Action',
			path: 'Path',
			deny: 'Deny',
			allow: 'Allow'
		},
		alerts: {
			clear_title: 'Clear Messages',
			clear_desc: 'Confirm clearing all message history?',
			delete_title: 'Delete Message',
			delete_desc: 'Confirm deleting this message?',
			archive_title: 'Archive Session Messages',
			archive_desc: 'Confirm archiving current context and loaded messages?'
		},
		question: {
			label: 'question',
			multiple: 'Multiple',
			placeholder: 'Type your answer...',
			submit: 'Submit'
		},
		codex_exec: {
			pending: 'Pending',
			running: 'Running',
			completed: 'Completed',
			denied: 'Denied',
			error: 'Error'
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

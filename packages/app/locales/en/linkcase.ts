export default {
	dialog: {
		edit_title: 'Edit Link',
		add_title: 'Add Link',
		edit_desc: 'Update the link metadata and optional cleaned content.',
		add_desc: 'Create a Linkcase entry manually. Favicon is fetched from the website automatically.',
		saving: 'Saving...',
		adding: 'Adding...',
		save: 'Save',
		add: 'Add',
		title: 'Title',
		title_placeholder: 'Optional. Defaults to the link URL.',
		link: 'Link',
		content: 'Content',
		content_hint: 'Optional. Paste cleaned main content directly.',
		content_placeholder:
			'If you already have the main body content, paste it here. Leave empty to add the link only.',
		cancel: 'Cancel'
	},
	content: {
		loading: 'Loading content',
		empty_markdown: 'No fetched markdown yet',
		select_hint: 'Select a link to inspect content'
	},
	toolbar: {
		search_placeholder: 'Search links',
		filter: 'Filter',
		title: 'title',
		link: 'link'
	},
	selection: {
		selected: '{{count}} selected',
		select_links: 'Select links',
		select_all: 'Select all',
		unselect_all: 'Unselect all',
		submitting: 'Submitting',
		fetch: 'Fetch',
		clear: 'Clear',
		removing: 'Removing',
		delete: 'Delete'
	},
	status: {
		none: 'none',
		pending: 'pending',
		success: 'success',
		fail: 'fail',
		timeout: 'timeout',
		ignore: 'ignore'
	}
} as const

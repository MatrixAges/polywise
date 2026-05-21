export interface CliProcedureMeta {
	cli?: {
		group?: Array<string>
		name?: string
		summary?: string
		hidden?: boolean
		examples?: Array<string>
	}
}

export const manual_api_meta = {
	save: {
		group: ['article'],
		name: 'save',
		summary: 'Create a new article and optionally run pipeline.',
		examples: ['polywise api article save --for user --content "..."']
	},
	update: {
		group: ['article'],
		name: 'update',
		summary: 'Update an existing article and optionally rerun pipeline.',
		examples: ['polywise api article update --id <id> --for user --content "..."']
	},
	test: {
		group: ['system'],
		name: 'test',
		summary: 'Basic server test endpoint.',
		examples: ['polywise api system test']
	},
	'session.create': {
		group: ['session'],
		name: 'create',
		summary: 'Create a session.',
		examples: ['polywise api session create --title "Daily Review"']
	},
	'session.rename': {
		group: ['session'],
		name: 'rename',
		summary: 'Rename a session.',
		examples: ['polywise api session rename --id <id> --title "New Title"']
	},
	'session.remove': {
		group: ['session'],
		name: 'remove',
		summary: 'Remove a session.',
		examples: ['polywise api session remove --id <id>']
	},
	'project.list': {
		group: ['project'],
		name: 'list',
		summary: 'List projects.',
		examples: ['polywise api project list']
	},
	'post.query': {
		group: ['post'],
		name: 'query',
		summary: 'Query posts by page and filters.',
		examples: ['polywise api post query --page 1']
	},
	'post.read': {
		group: ['post'],
		name: 'read',
		summary: 'Read a single post.',
		examples: ['polywise api post read --id <id>']
	},
	'tool.query': {
		group: ['tool'],
		name: 'query',
		summary: 'List custom tools.',
		examples: ['polywise api tool query']
	},
	'file.read': {
		group: ['file'],
		name: 'read',
		summary: 'Read a local file.',
		examples: ['polywise api file read --path /tmp/demo.txt']
	},
	'search.fullTextSearch': {
		group: ['search'],
		name: 'full-text',
		summary: 'Full-text search for articles.',
		examples: ['polywise api search full-text --query "topic"']
	},
	'search.semanticSearch': {
		group: ['search'],
		name: 'semantic',
		summary: 'Semantic article search.',
		examples: ['polywise api search semantic --query "topic"']
	},
	'search.relationSearch': {
		group: ['search'],
		name: 'relation',
		summary: 'Relation graph article search.',
		examples: ['polywise api search relation --query "topic"']
	},
	'search.hybirdSearch': {
		group: ['search'],
		name: 'hybird',
		summary: 'Hybrid article search.',
		examples: ['polywise api search hybird --query "topic"']
	}
} satisfies Record<
	string,
	{
		group: Array<string>
		name: string
		summary: string
		examples: Array<string>
	}
>

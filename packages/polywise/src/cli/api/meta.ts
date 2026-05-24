export const manual_api_meta = {
	save: {
		examples: ['polywise api save --for user --content "..."']
	},
	update: {
		examples: ['polywise api update --id <id> --for user --content "..."']
	},
	test: {
		examples: ['polywise api test']
	},
	'session.create': {
		examples: ['polywise api session create --title "Daily Review"']
	},
	'session.rename': {
		examples: ['polywise api session rename --id <id> --title "New Title"']
	},
	'session.remove': {
		examples: ['polywise api session remove --id <id>']
	},
	'project.list': {
		examples: ['polywise api project list']
	},
	'post.query': {
		examples: ['polywise api post query --page 1']
	},
	'post.read': {
		examples: ['polywise api post read --id <id>']
	},
	'tool.query': {
		examples: ['polywise api tool query']
	},
	'file.read': {
		examples: ['polywise api file read --path /tmp/demo.txt']
	},
	'search.fullTextSearch': {
		examples: ['polywise api search fullTextSearch --query "topic"']
	},
	'search.semanticSearch': {
		examples: ['polywise api search semanticSearch --query "topic"']
	},
	'search.relationSearch': {
		examples: ['polywise api search relationSearch --query "topic"']
	},
	'search.hybirdSearch': {
		examples: ['polywise api search hybirdSearch --query "topic"']
	},
	stop: {
		examples: ['polywise stop']
	},
	restart: {
		examples: ['polywise restart']
	},
	upgrade: {
		examples: ['polywise upgrade']
	}
} satisfies Record<
	string,
	{
		examples?: Array<string>
		hidden?: boolean
	}
>

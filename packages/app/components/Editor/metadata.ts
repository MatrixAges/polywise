export const action_bar_ignore_nodes = ['test', 'codeBlock', 'image', 'blockMath', 'inlineMath', 'mermaid']

export const modal_size = {
	emoji: 270,
	mermaid: 420
}

export const menu_items = [
	{ key: 'image', shortcut: 'img', icon: 'image' },
	{ key: 'emoji', shortcut: 'emo', icon: 'smiley' },
	{ key: 'code', shortcut: 'cd', icon: 'code-simple' },
	{ key: 'unorder_list', shortcut: 'ul', icon: 'list-bullets' },
	{ key: 'order_list', shortcut: 'ol', icon: 'list-numbers' },
	{ key: 'todo_list', shortcut: 'tl', icon: 'list-checks' },
	{ key: 'table', shortcut: 'tb', icon: 'table' },
	{ key: 'divider', shortcut: 'dv', icon: 'divide' },
	{ key: 'quote', shortcut: 'qt', icon: 'quotes' },
	{ key: 'details', shortcut: 'dt', icon: 'caret-down' },
	{ key: 'function', shortcut: 'fn', icon: 'function' },
	{ key: 'mermaid', shortcut: 'md', icon: 'tree-structure' },
	{ key: 'toc', shortcut: 'toc', icon: 'tree-view' }
] as const

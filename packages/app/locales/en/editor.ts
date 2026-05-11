export default {
	placeholder: 'Write something, press / to show menu',
	block: {
		image: 'Image',
		emoji: 'Emoji',
		code: 'Code',
		unorder_list: 'Bullet List',
		order_list: 'Order List',
		todo_list: 'Todo List',
		table: 'Table',
		divider: 'Divider',
		quote: 'Quote',
		details: 'Details',
		function: 'Function',
		mermaid: 'Mermaid',
		toc: 'Toc'
	},
	Image: {
		label: {
			url: 'URL',
			file: 'File',
			alt: 'Alt'
		},
		placeholder: {
			url: 'Image URL',
			alt: 'Image alt text'
		}
	},
	Katex: {
		modal: {
			label: {
				equation: 'Equation',
				inline: 'Inline'
			},
			placeholder: {
				equation: 'Equation expression'
			}
		}
	},
	Mermaid: {
		modal: {
			label: {
				definition: 'Definition'
			},
			placeholder: 'Graph definition'
		}
	},
	Navigation: {
		empty: 'No Headings detected'
	},
	Table: {
		actions: {
			header_row: 'Header Row',
			insert_above: 'Insert Above',
			insert_below: 'Insert Below',
			align: {
				title: 'Align',
				left: 'Left',
				center: 'Center',
				right: 'Right'
			},
			header_col: 'Header Col',
			insert_left: 'Insert Left',
			insert_right: 'Insert Right',
			reset_width: 'Reset Width'
		}
	}
}

import { Editor, Extension } from '@tiptap/core'
import { BubbleMenuPlugin } from '@tiptap/extension-bubble-menu'
import { FloatingMenuPlugin } from '@tiptap/extension-floating-menu'
import { migrateMathStrings } from '@tiptap/extension-mathematics'
import { findSuggestionMatch } from '@tiptap/suggestion'
import { debounce } from 'es-toolkit'
import { makeAutoObservable } from 'mobx'

import { nextTick } from '@/utils'

import getExtensions from './extensions'
import { action_bar_ignore_nodes, menu_items } from './metadata'
import { getContentString, renderer } from './utils'

import type { EditorWithContentComponent } from '@/types'
import type { ReactPortal } from 'react'
import type { ArgsInit, Toc } from './types'

export default class Index {
	id = ''
	editor = null as unknown as EditorWithContentComponent
	mounted = false
	debounced_on_change = null as unknown as {
		(v: string): void
		cancel: () => void
		flush: () => void
	}

	ref_container = null as unknown as HTMLDivElement
	ref_action_bar = null as unknown as HTMLDivElement
	ref_menu = null as unknown as HTMLDivElement

	signal = 0
	focus = null as 'table' | null
	counts = 1
	react_nodes = [] as Array<ReactPortal>
	current_menu_items = menu_items
	latest_menu_items = [] as Array<number>
	modal_type = null as 'image' | 'emoji' | 'function' | 'mermaid' | 'toc' | null
	modal_context = null as any
	modal_visible = false
	toc = [] as Toc

	constructor() {
		makeAutoObservable(
			this,
			{
				id: false,
				editor: false,
				debounced_on_change: false,
				ref_container: false,
				ref_action_bar: false,
				ref_menu: false,
				mounted: false,
				react_nodes: false,
				modal_context: false
			},
			{ autoBind: true }
		)
	}

	init(args: ArgsInit) {
		const { id, value, readonly, onChange, onBlur } = args
		const normalized_value = value.trim()
		const content_type =
			normalized_value.startsWith('{') || normalized_value.startsWith('[') ? 'json' : 'markdown'

		this.id = id
		this.debounced_on_change = debounce(onChange, 450)

		this.editor = new Editor({
			editable: !readonly,
			extensions: [...getExtensions({ id: this.id, setToc: v => (this.toc = v) }), ...this.getExtensions()],
			content: value ? getContentString(value) : '',
			contentType: content_type,
			onCreate: ({ editor }) => {
				migrateMathStrings(editor)

				this.mount()
				this.registerActionBar()
				this.registerMenu()

				this.update()
			},
			onUpdate: ({ editor }) => {
				this.debounced_on_change(editor.getMarkdown())
			},
			onBlur: () => {
				this.debounced_on_change.flush()
				onBlur?.(this.editor.getMarkdown())
			},
			onTransaction: ({ editor, transaction }) => {
				if (this.mounted) this.updateReactNodes()

				const history = transaction.getMeta('history$')

				if (history !== undefined) this.update()

				if (editor.isActive('table')) {
					this.focus = 'table'
				} else {
					this.focus = null
				}

				this.counts = editor.storage.characterCount.characters()
			}
		}) as Index['editor']

		this.on()
	}

	mount() {
		if (this.mounted || !this.ref_container) return

		this.mounted = true

		const source_element = this.editor.options.element instanceof Element ? this.editor.options.element : null

		if (source_element?.childNodes.length) {
			this.ref_container.append(...Array.from(source_element.childNodes))
		}

		this.editor.setOptions({ element: this.ref_container })

		this.editor.contentComponent = renderer()

		this.editor.createNodeViews()

		nextTick(this.updateReactNodes)
	}

	onMenuItem(index: number) {
		const target = this.current_menu_items[index]

		switch (target.key) {
			case 'image':
			case 'emoji':
			case 'function':
			case 'mermaid':
			case 'toc':
				this.editor.commands.showModal(target.key)

				break
			case 'code':
				break
			case 'unorder_list':
				break
			case 'order_list':
				break
			case 'todo_list':
				break
			case 'table':
				break
			case 'divider':
				break
			case 'quote':
				break
			case 'details':
				const { pos } = this.editor.state.selection.$from
				const { from, to } = this.editor.state.selection
				const nodes = this.editor.schema.nodes

				const detail_node = nodes.details.create({ open: true }, [
					nodes.detailsSummary.create(),
					nodes.detailsContent.create({}, [nodes.paragraph.create()])
				])

				const transaction = this.editor.state.tr

				transaction.replaceRangeWith(from - 1, to, detail_node)

				this.editor.view.dispatch(transaction)
				this.editor.chain().focus(pos).run()

				break
		}

		this.setLatestMenuItem(menu_items.findIndex(item => item.key === target.key))
	}

	setLatestMenuItem(v: number) {
		const exsit_index = this.latest_menu_items.findIndex(item => item === v)

		if (exsit_index !== -1) {
			this.latest_menu_items.splice(exsit_index, 1)
		} else {
			if (this.latest_menu_items.length === 5) {
				this.latest_menu_items.pop()
			}
		}

		this.latest_menu_items.unshift(v)

		this.latest_menu_items = $copy(this.latest_menu_items)
	}

	getExtensions() {
		const that = this

		return [
			Extension.create({
				name: 'modal',
				addCommands() {
					return {
						showModal: (type: Index['modal_type'], context?: any) => () => {
							that.modal_type = type
							that.modal_context = context
							that.modal_visible = true

							return true
						},
						closeModal: () => () => {
							that.modal_type = null
							that.modal_context = null
							that.modal_visible = false

							return true
						}
					}
				}
			})
		]
	}

	registerActionBar() {
		if (!this.editor || this.editor?.isDestroyed) return

		const plugin = BubbleMenuPlugin({
			pluginKey: 'action_bar',
			updateDelay: 120,
			editor: this.editor,
			element: this.ref_action_bar,
			options: {
				placement: 'top',
				offset: 6,
				shift: { padding: 6, boundary: this.ref_container },
				flip: { boundary: this.ref_container }
			},
			shouldShow: ({ editor }) => {
				if (action_bar_ignore_nodes.some(item => editor.isActive(item))) {
					return false
				}

				return editor.view.state.selection.from !== editor.view.state.selection.to
			}
		})

		this.editor.registerPlugin(plugin)
	}

	registerMenu() {
		if (!this.editor || this.editor?.isDestroyed) return

		const plugin = FloatingMenuPlugin({
			pluginKey: 'menu',
			editor: this.editor,
			element: this.ref_menu,
			options: {
				placement: 'bottom-start',
				offset: 6,
				shift: { padding: 6, boundary: this.ref_container },
				flip: { boundary: this.ref_container },
				size: {
					padding: 6,
					apply: ({ availableHeight }) => {
						Object.assign(this.ref_menu.style, {
							maxHeight: `${availableHeight}px`
						})
					}
				}
			},
			shouldShow: ({ state }) => {
				const match = findSuggestionMatch({
					char: '/',
					$position: state.selection.$from,
					startOfLine: false,
					allowSpaces: false,
					allowedPrefixes: null,
					allowToIncludeChar: false
				})

				return Boolean(match)
			}
		})

		this.editor.registerPlugin(plugin)
	}

	updateReactNodes() {
		this.react_nodes = Object.values(this.editor.contentComponent?.getSnapshot()!)

		this.update()
	}

	update() {
		this.signal += 1
	}

	showModal(args: { type: Index['modal_type']; context: Index['modal_context'] }) {
		const { type, context } = args

		this.editor.commands.showModal(type, context)
	}

	on() {
		window.$app.Event.on(`${this.id}/editor/ShowModal`, this.showModal)
	}

	off() {
		this.debounced_on_change?.cancel()
		this.editor.contentComponent?.unsubscribe()
		this.editor.contentComponent = null

		this.editor.destroy()

		window.$app.Event.off(`${this.id}/editor/ShowModal`, this.showModal)

		this.ref_container = null as unknown as Index['ref_container']
		this.ref_action_bar = null as unknown as Index['ref_container']
	}
}

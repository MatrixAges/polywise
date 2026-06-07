import { Editor, Extension } from '@tiptap/core'
import { BubbleMenuPlugin } from '@tiptap/extension-bubble-menu'
import { FloatingMenuPlugin } from '@tiptap/extension-floating-menu'
import { migrateMathStrings } from '@tiptap/extension-mathematics'
import { findSuggestionMatch } from '@tiptap/suggestion'
import { debounce } from 'es-toolkit'
import { makeAutoObservable } from 'mobx'

import { cn } from '@/__shadcn__/lib/utils'
import { nextTick } from '@/utils'

import getExtensions from './extensions'
import { action_bar_ignore_nodes, menu_items } from './metadata'
import { getContentString, renderer } from './utils'

import type { EditorWithContentComponent } from '@/types'
import type { ReactPortal } from 'react'
import type { ArgsInit, Toc } from './types'

export default class Index {
	id = ''
	editor: EditorWithContentComponent = null!
	mounted = false
	debounced_on_change: ((v: string) => void) & { cancel: () => void; flush: () => void } = null!
	on_character_count_change = null as ((count: number) => void) | null

	ref_container: HTMLDivElement = null!
	ref_action_bar: HTMLDivElement = null!
	ref_menu: HTMLDivElement = null!

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
				on_character_count_change: false,
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

	getEditorClassName(className?: string) {
		return cn('tiptap', className)
	}

	getContentType(value: string) {
		const normalized_value = value.trim()

		return normalized_value.startsWith('{') || normalized_value.startsWith('[') ? 'json' : 'markdown'
	}

	emitCharacterCount(
		onCharacterCountChange = this.on_character_count_change,
		editor: Pick<Editor, 'storage'> = this.editor
	) {
		const count = editor.storage.characterCount.characters()

		this.counts = count
		onCharacterCountChange?.(count)
	}

	init(args: ArgsInit) {
		const { id, value, className, readonly, onChange, onBlur, onCharacterCountChange } = args
		const content_type = this.getContentType(value)

		this.id = id
		this.debounced_on_change = debounce(onChange, 450)
		this.on_character_count_change = onCharacterCountChange ?? null

		this.editor = new Editor({
			editable: !readonly,
			extensions: [...getExtensions({ id: this.id, setToc: v => (this.toc = v) }), ...this.getExtensions()],
			content: value ? getContentString(value) : '',
			contentType: content_type,
			editorProps: {
				attributes: {
					class: this.getEditorClassName(className)
				}
			},
			onCreate: ({ editor }) => {
				migrateMathStrings(editor)

				this.mount()
				this.registerActionBar()
				this.registerMenu()

				this.update()
				this.emitCharacterCount(onCharacterCountChange, editor)
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

				this.emitCharacterCount(onCharacterCountChange, editor)
			}
		}) as EditorWithContentComponent

		this.on()
	}

	syncValue(value: string) {
		if (!this.mounted || !this.editor || this.editor.isDestroyed) return

		const current_value = this.editor.getMarkdown()
		const content_type = this.getContentType(value)

		if (current_value === value) return

		this.debounced_on_change?.cancel()
		this.editor.commands.setContent(getContentString(value), {
			emitUpdate: false,
			contentType: content_type
		})

		this.emitCharacterCount()
		this.updateReactNodes()
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
				onShow: () => this.ref_menu?.setAttribute('data-floating-visible', 'true'),
				onHide: () => this.ref_menu?.setAttribute('data-floating-visible', 'false'),
				size: {
					padding: 6,
					apply: ({ availableHeight }) => {
						Object.assign(this.ref_menu.style, {
							maxHeight: `${availableHeight}px`
						})
					}
				}
			},
			shouldShow: ({ editor, view, state }) => {
				if (!editor.isEditable || !view.hasFocus() || !state.selection.empty) {
					return false
				}

				if (!state.selection.$from.parent.isTextblock || state.selection.$from.parent.type.spec.code) {
					return false
				}

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
		const snapshot = this.editor.contentComponent?.getSnapshot()

		this.react_nodes = snapshot ? Object.values(snapshot) : []

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

		this.ref_container = null!
		this.ref_action_bar = null!
		this.ref_menu = null!
	}
}

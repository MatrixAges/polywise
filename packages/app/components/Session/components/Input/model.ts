import { makeAutoObservable, observable } from 'mobx'

import Setting from '@/models/setting'
import { rpc } from '@/utils'

import {
	createSkillItems,
	filterMentionItems,
	getActiveMentionFromEditor,
	getBasename,
	getMentionHeading,
	getMentionInsertContent,
	getMentionSections
} from './utils'

import type { AppConfig } from '@core/types'
import type { Editor as TiptapEditor } from '@tiptap/core'
import type { KeyboardEvent as ReactKeyboardEvent } from 'react'
import type { IPropsInput } from '../../types'
import type {
	ActiveMention,
	AgentMentionItem,
	FileMentionItem,
	MentionItem,
	SkillMentionItem,
	ToolMentionItem
} from './types'

export default class Model {
	props = null as unknown as IPropsInput
	setting = null as unknown as Setting
	editor = null as TiptapEditor | null

	compositing = false
	full = false
	active_mention = null as ActiveMention | null
	skill_items = [] as Array<SkillMentionItem>
	tool_items = [] as Array<ToolMentionItem>
	agent_items = [] as Array<AgentMentionItem>
	file_items = [] as Array<FileMentionItem>
	loading_skills = false
	loading_tools = false
	loading_agents = false
	loading_files = false
	active_index = 0

	skill_items_loaded = false
	tool_items_loaded_session_id = ''
	agent_items_loaded_session_id = ''
	file_items_loaded_session_id = ''
	skill_items_requested = false
	tool_items_requested_session_id = ''
	agent_items_requested_session_id = ''
	file_items_requested_session_id = ''

	constructor(props: IPropsInput, setting: Setting) {
		this.props = props
		this.setting = setting

		makeAutoObservable(
			this,
			{
				props: observable.ref,
				setting: false,
				editor: false
			},
			{ autoBind: true }
		)
	}

	sync(props: IPropsInput, setting: Setting) {
		this.props = props
		this.setting = setting
	}

	get session_id() {
		return this.props.session_id
	}

	get is_page() {
		return this.props.type === 'page' || this.props.type === 'dialog'
	}

	get mention_items() {
		return this.active_mention
			? filterMentionItems(
					this.active_mention.trigger === '/'
						? [...this.tool_items, ...this.skill_items]
						: [...this.agent_items, ...this.file_items],
					this.active_mention.query
				)
			: []
	}

	get mention_open() {
		return !!this.active_mention
	}

	get mention_heading() {
		return getMentionHeading(this.active_mention)
	}

	get mention_sections() {
		return getMentionSections(this.active_mention, this.mention_items)
	}

	get mention_loading() {
		return this.active_mention?.trigger === '/'
			? this.loading_tools || this.loading_skills
			: this.active_mention?.trigger === '@'
				? this.loading_agents || this.loading_files
				: false
	}

	get default_model() {
		const model = this.setting.config?.default_model

		return model ? { provider: model.provider, model: model.model, effort: model.effort } : undefined
	}

	get default_effort() {
		return this.default_model?.effort ?? 'default'
	}

	get file_query_key() {
		const query = this.active_mention?.trigger === '@' ? this.active_mention.query.trim() : ''

		return `${this.session_id}::${query}`
	}

	setEditor(editor: TiptapEditor | null) {
		this.editor = editor
	}

	toggleFull() {
		this.full = !this.full
	}

	setCompositing(value: boolean) {
		this.compositing = value
	}

	syncEditorState(instance: TiptapEditor | null) {
		if (!instance) return

		this.active_mention = getActiveMentionFromEditor(instance)
	}

	handleEditorCreate(instance: TiptapEditor | null) {
		this.setEditor(instance)
		this.syncEditorState(instance)
	}

	handleEditorSelectionUpdate(instance: TiptapEditor | null) {
		this.active_mention = getActiveMentionFromEditor(instance)
	}

	handleEditorUpdate(instance: TiptapEditor | null) {
		this.syncEditorState(instance)
	}

	resetMentionIndex() {
		this.active_index = 0
	}

	async loadSkillItems() {
		if (this.active_mention?.trigger !== '/') {
			this.skill_items_requested = false

			return
		}

		if (this.skill_items_loaded || this.skill_items_requested) {
			return
		}

		this.skill_items_requested = true
		this.loading_skills = true

		try {
			const items = await rpc.skill.query.query()

			this.skill_items = createSkillItems(items)
			this.skill_items_loaded = true
		} catch {
			this.skill_items = []
		} finally {
			this.loading_skills = false
		}
	}

	async loadToolItems() {
		if (this.active_mention?.trigger !== '/') {
			this.tool_items_requested_session_id = ''

			return
		}

		if (
			this.tool_items_loaded_session_id === this.session_id ||
			this.tool_items_requested_session_id === this.session_id
		) {
			return
		}

		this.tool_items_requested_session_id = this.session_id
		this.tool_items = []
		this.loading_tools = true

		try {
			const items = await rpc.session.getMentionTools.query({ id: this.session_id })

			this.tool_items = items.map(item => ({
				key: item.name,
				type: 'tool' as const,
				label: item.name,
				desc: item.description || '',
				search_text: `${item.name} ${item.description || ''}`.toLowerCase()
			}))
			this.tool_items_loaded_session_id = this.session_id
		} catch {
			this.tool_items = []
		} finally {
			this.loading_tools = false
		}
	}

	async loadAgentItems() {
		if (this.active_mention?.trigger !== '@') {
			this.agent_items_requested_session_id = ''

			return
		}

		if (
			this.agent_items_loaded_session_id === this.session_id ||
			this.agent_items_requested_session_id === this.session_id
		) {
			return
		}

		this.agent_items_requested_session_id = this.session_id
		this.agent_items = []
		this.loading_agents = true

		try {
			const items = await rpc.session.getMentionAgents.query({ id: this.session_id })

			this.agent_items = items.map(item => ({
				key: item.id,
				type: 'agent' as const,
				label: item.name,
				role: item.role || '',
				desc: item.description || '',
				photo: (item.photo as Uint8Array | null | undefined) ?? null,
				avatar: item.avatar ?? null,
				search_text: `${item.name} ${item.role || ''} ${item.description || ''}`.toLowerCase()
			}))
			this.agent_items_loaded_session_id = this.session_id
		} catch {
			this.agent_items = []
		} finally {
			this.loading_agents = false
		}
	}

	async loadFileItems() {
		if (this.active_mention?.trigger !== '@') {
			this.file_items_requested_session_id = ''

			return
		}

		if (
			this.file_items_loaded_session_id === this.file_query_key ||
			this.file_items_requested_session_id === this.file_query_key
		) {
			return
		}

		this.file_items_requested_session_id = this.file_query_key
		this.file_items = []
		this.loading_files = true

		try {
			const res = await rpc.session.getMentionFiles.query({
				id: this.session_id,
				query: this.active_mention.query
			})

			this.file_items = res.items.map(item => ({
				key: item.absolute_path,
				type: 'file' as const,
				label: item.path,
				path: item.path,
				basename: getBasename(item.path),
				file_kind: item.type,
				search_text: item.path
			}))
			this.file_items_loaded_session_id = this.file_query_key
		} catch {
			this.file_items = []
		} finally {
			this.loading_files = false
		}
	}

	syncDraftInput() {
		if (!this.props.draft_input || !this.editor) {
			return
		}

		this.editor.commands.setContent(this.props.draft_input.value, {
			contentType: 'markdown',
			emitUpdate: false
		})
		this.active_mention = null

		requestAnimationFrame(() => {
			this.editor?.commands.focus('end')
		})
	}

	onChangeDefaultMode(v: AppConfig['default_model']) {
		this.setting.setConfig('config', { default_model: v } as AppConfig, true)
	}

	onChangeDefaultEffort(v: string) {
		const default_model = this.setting.config?.default_model

		if (!default_model) return

		this.setting.setConfig('config', { default_model: { ...default_model, effort: v } } as AppConfig, true)
	}

	onChangeSubmitMode(v: string) {
		this.setting.setConfig('config', { submit_mode: v } as AppConfig, true)
	}

	applyMention(item: MentionItem) {
		if (!this.editor || !this.active_mention) return

		this.editor
			.chain()
			.focus()
			.deleteRange({ from: this.active_mention.start, to: this.active_mention.end })
			.insertContent(getMentionInsertContent(item))
			.run()
	}

	onSend() {
		if (this.props.streaming || this.compositing || !this.editor) return

		const next_value = this.editor.getMarkdown()

		if (!next_value) return

		this.props.send(next_value)
		this.active_mention = null
		this.editor.commands.setContent('', { contentType: 'markdown', emitUpdate: false })
	}

	onSubmit(e: ReactKeyboardEvent<HTMLDivElement>) {
		const submit_mode = this.setting.config?.submit_mode || 'enter'

		if (this.props.streaming || this.compositing || !this.editor) return

		if (this.mention_open && this.mention_items.length > 0) {
			if (e.key === 'ArrowDown') {
				e.preventDefault()
				this.active_index = (this.active_index + 1) % this.mention_items.length

				return
			}

			if (e.key === 'ArrowUp') {
				e.preventDefault()
				this.active_index =
					(this.active_index - 1 + this.mention_items.length) % this.mention_items.length

				return
			}

			if (e.key === 'Enter' || e.key === 'Tab') {
				e.preventDefault()
				this.applyMention(
					this.mention_items[Math.min(this.active_index, this.mention_items.length - 1)]
				)

				return
			}
		}

		if (submit_mode === 'enter') {
			if (e.key === 'Enter' && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
				e.preventDefault()
				this.onSend()

				return
			}

			if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
				e.preventDefault()
				this.editor.chain().focus().setHardBreak().run()
			}

			return
		}

		if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
			e.preventDefault()
			this.onSend()
		}
	}
}

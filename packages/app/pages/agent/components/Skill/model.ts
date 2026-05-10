import { arrayMove } from '@dnd-kit/sortable'
import { makeAutoObservable } from 'mobx'
import { injectable } from 'tsyringe'

import { Files, Util } from '@/models/common'
import { rpc } from '@/utils'

import type { ContextMenuItem, ContextMenuOpenContext, FileTree as TreeInstance } from '@pierre/trees'
import type {
	DetailMode,
	SkillItem,
	SkillTreeComposition,
	SkillTreeMutationEvent,
	SkillTreeRenamingItem
} from './types'

@injectable()
export default class Index {
	skill_items = [] as Array<SkillItem>
	selected_skill_id = ''
	detail_mode = 'preview' as DetailMode
	edit_dialog_open = false
	edit_name = ''
	edit_desc = ''
	edit_content = ''
	file_tree = null as TreeInstance | null

	get selected_skill() {
		return this.skill_items.find(item => item.id === this.selected_skill_id) || null
	}

	get selected_file() {
		return this.skill_files.select_file
	}

	constructor(
		public util: Util,
		public skill_files: Files
	) {
		makeAutoObservable(this, { util: false, skill_files: false, file_tree: false }, { autoBind: true })
	}

	async init() {
		this.util.acts = [() => this.skill_files.reset()]

		await this.refresh()
	}

	deinit() {
		this.util.deinit()
	}

	setFileTree(tree: TreeInstance | null) {
		this.file_tree = tree
	}

	getRelativeSkillFilePath(target_path: string, skill_path: string) {
		if (!target_path || !skill_path) {
			return 'SKILL.md'
		}

		const base_prefix = skill_path.endsWith('/') ? skill_path : `${skill_path}/`

		if (target_path === skill_path) {
			return ''
		}

		if (!target_path.startsWith(base_prefix)) {
			return 'SKILL.md'
		}

		return target_path.replace(base_prefix, '')
	}

	getSkillFilePath(file_path = 'SKILL.md') {
		if (!this.selected_skill) {
			return ''
		}

		if (!file_path) {
			return this.selected_skill.path
		}

		if (file_path.startsWith(this.selected_skill.path)) {
			return file_path
		}

		return `${this.selected_skill.path}/${file_path}`
	}

	isProtectedSkillFile(target_path: string) {
		return target_path.split('/').filter(Boolean).at(-1) === 'SKILL.md'
	}

	getAbsoluteTreePath(target_path: string) {
		return this.skill_files.getAbsolutePath(target_path)
	}

	getTreeParentPath(args: { item_path: string; directory: boolean }) {
		const { item_path, directory } = args

		if (directory) {
			return this.getAbsoluteTreePath(item_path)
		}

		return this.getAbsoluteTreePath(item_path).split('/').slice(0, -1).join('/')
	}

	canRenameTreeItem(item: SkillTreeRenamingItem) {
		return !this.isProtectedSkillFile(this.getAbsoluteTreePath(item.path))
	}

	getTreeComposition() {
		return {
			contextMenu: {
				enabled: true,
				triggerMode: 'right-click',
				render: (item, context) => this.renderTreeContextMenu({ item, context })
			}
		} satisfies SkillTreeComposition
	}

	getTreeDragAndDrop() {
		return {
			canDrag: (paths: readonly string[]) => {
				return paths.every(item => !this.isProtectedSkillFile(this.getAbsoluteTreePath(item)))
			}
		}
	}

	renderTreeContextMenu(args: { item: ContextMenuItem; context: ContextMenuOpenContext }) {
		const { item, context } = args
		const mount_node = document.createElement('div')
		const root = document.createElement('div')

		mount_node.append(root)

		const item_button_class =
			'flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm cursor-default select-none hover:bg-accent'
		const disabled_item_button_class = 'pointer-events-none opacity-50'

		const close_menu = () => {
			mount_node.remove()
			context.close()
		}

		const create_item = (label: string, disabled: boolean, onClick: () => void) => {
			const button = document.createElement('button')
			button.className = $cx(item_button_class, disabled && disabled_item_button_class)
			button.textContent = label
			button.type = 'button'

			if (!disabled) {
				button.onclick = () => {
					onClick()
					close_menu()
				}
			}

			return button
		}

		root.className =
			'z-50 min-w-36 rounded-2xl bg-popover p-1 text-popover-foreground shadow-2xl ring-1 ring-foreground/5'
		root.setAttribute('data-file-tree-context-menu-root', 'true')
		root.style.position = 'fixed'
		root.style.left = `${context.anchorRect.x}px`
		root.style.top = `${context.anchorRect.y}px`

		root.append(
			create_item('New File', false, () => {
				void this.createTreeEntry({
					item_path: item.path,
					directory: item.kind === 'directory',
					type: 'file'
				})
			}),
			create_item('New Folder', false, () => {
				void this.createTreeEntry({
					item_path: item.path,
					directory: item.kind === 'directory',
					type: 'folder'
				})
			}),
			create_item(
				'Rename',
				!this.canRenameTreeItem({ isFolder: item.kind === 'directory', path: item.path }),
				() => {
					context.close({ restoreFocus: false })
					this.startRenameTreeEntry(item.path)
				}
			),
			create_item('Remove', item.name === 'SKILL.md', () => {
				void this.removeTreeEntry(item.path)
			})
		)

		return mount_node
	}

	async refresh(selected_file_relative_path = 'SKILL.md') {
		const skill_items = await rpc.skill.query.query()

		this.skill_items = skill_items as Array<SkillItem>

		if (!this.skill_items.length) {
			this.selected_skill_id = ''
			this.edit_name = ''
			this.edit_desc = ''
			this.edit_content = ''
			this.skill_files.reset()

			return
		}

		const has_selected_skill = this.skill_items.some(item => item.id === this.selected_skill_id)

		if (!has_selected_skill) {
			this.selected_skill_id = this.skill_items[0].id
			selected_file_relative_path = 'SKILL.md'
		}

		await this.loadSelectedSkill(selected_file_relative_path)
	}

	async loadSelectedSkill(selected_file_relative_path = 'SKILL.md') {
		if (!this.selected_skill) {
			return
		}

		this.edit_name = this.selected_skill.name
		this.edit_desc = this.selected_skill.desc
		this.detail_mode = 'preview'

		await this.skill_files.init(this.selected_skill.path, { dir_only: false, show_hidden: true })

		const file_path = this.getSkillFilePath(selected_file_relative_path)
		const skill_file = await rpc.file.read.query({ path: file_path })

		this.edit_content = skill_file?.contents || ''

		if (skill_file) {
			this.skill_files.select_file_path = skill_file.path
			this.skill_files.select_file = skill_file
		} else {
			this.skill_files.select_file_path = ''
			this.skill_files.select_file = null
		}
	}

	async setSelectedSkill(skill_id: string) {
		if (this.selected_skill_id === skill_id) {
			return
		}

		this.selected_skill_id = skill_id

		await this.loadSelectedSkill('SKILL.md')
	}

	setDetailMode(mode: DetailMode) {
		this.detail_mode = mode
	}

	async openEditDialog(skill_id: string) {
		if (this.selected_skill_id !== skill_id) {
			this.selected_skill_id = skill_id

			await this.loadSelectedSkill('SKILL.md')
		}

		if (!this.selected_skill) {
			return
		}

		this.edit_name = this.selected_skill.name
		this.edit_desc = this.selected_skill.desc
		this.edit_dialog_open = true
	}

	closeEditDialog() {
		this.edit_dialog_open = false

		if (!this.selected_skill) {
			return
		}

		this.edit_name = this.selected_skill.name
		this.edit_desc = this.selected_skill.desc
	}

	setEditName(value: string) {
		this.edit_name = value
	}

	setEditDesc(value: string) {
		this.edit_desc = value
	}

	setEditContent(value: string) {
		this.edit_content = value

		if (!this.skill_files.select_file) {
			return
		}

		this.skill_files.select_file = {
			...this.skill_files.select_file,
			contents: value
		}
	}

	async selectPath(args: { directory: boolean; path: string }) {
		await this.skill_files.selectPath(args)

		if (!args.directory && this.skill_files.select_file) {
			this.edit_content = this.skill_files.select_file.contents
			this.detail_mode = 'preview'
		}
	}

	async createTreeEntry(args: { item_path: string; directory: boolean; type: 'file' | 'folder' }) {
		if (!this.selected_skill) {
			return
		}

		const { item_path, directory, type } = args
		const parent_path = this.getTreeParentPath({ item_path, directory })
		const name = type === 'folder' ? 'new-folder' : 'new-file.txt'

		await rpc.skill.createEntry.mutate({
			skill_id: this.selected_skill.id,
			parent_path,
			name,
			type
		})

		await this.refresh(this.getRelativeSkillFilePath(this.selected_file?.path || '', this.selected_skill.path))
	}

	async removeTreeEntry(item_path: string) {
		if (!this.selected_skill) {
			return
		}

		const target_path = this.getAbsoluteTreePath(item_path)

		if (this.isProtectedSkillFile(target_path)) {
			return
		}

		await rpc.skill.removeEntry.mutate({
			skill_id: this.selected_skill.id,
			path: target_path
		})

		const next_selected_file_path =
			this.selected_file?.path === target_path ? '' : this.selected_file?.path || ''

		await this.refresh(this.getRelativeSkillFilePath(next_selected_file_path, this.selected_skill.path))
	}

	startRenameTreeEntry(item_path: string) {
		this.file_tree?.startRenaming(item_path)
	}

	async onTreeMutation(event: SkillTreeMutationEvent) {
		if (!this.selected_skill) {
			return
		}

		if (event.operation !== 'move' && event.operation !== 'batch') {
			return
		}

		const operations =
			event.operation === 'move' ? [event] : event.events.filter(item => item.operation === 'move')

		if (!operations.length) {
			return
		}

		const move_operations = operations.map(item => ({
			from: this.getAbsoluteTreePath(item.from),
			to: this.getAbsoluteTreePath(item.to)
		}))

		if (move_operations.some(item => this.isProtectedSkillFile(item.from))) {
			await this.refresh(
				this.getRelativeSkillFilePath(this.selected_file?.path || '', this.selected_skill.path)
			)

			return
		}

		await rpc.skill.moveEntries.mutate({
			skill_id: this.selected_skill.id,
			operations: move_operations
		})

		let next_selected_file_path = this.selected_file?.path || ''

		for (const item of move_operations) {
			if (next_selected_file_path === item.from) {
				next_selected_file_path = item.to
			}
		}

		await this.refresh(this.getRelativeSkillFilePath(next_selected_file_path, this.selected_skill.path))
	}

	async createSkill() {
		const skill_item = await rpc.skill.create.mutate({
			name: `skill-${this.skill_items.length + 1}`,
			desc: '',
			content: '# New Skill\n',
			type: 'local'
		})

		await this.refresh()

		if (skill_item?.id) {
			this.selected_skill_id = skill_item.id
			await this.loadSelectedSkill('SKILL.md')
		}
	}

	async saveSkill() {
		if (!this.selected_skill) {
			return
		}

		const next_name = this.edit_name.trim()
		const next_desc = this.edit_desc.trim()

		if (!next_name) {
			return
		}

		const skill_path = this.selected_skill.path
		const target_file = this.selected_file?.path || `${skill_path}/SKILL.md`
		const selected_file_relative_path = this.getRelativeSkillFilePath(target_file, skill_path)
		const is_skill_file = target_file.endsWith('/SKILL.md') || target_file.endsWith('SKILL.md')

		if (is_skill_file) {
			await rpc.skill.update.mutate({
				id: this.selected_skill.id,
				name: next_name,
				desc: next_desc,
				content: this.edit_content,
				type: this.selected_skill.type || undefined
			})
		} else {
			await rpc.skill.saveFile.mutate({
				skill_id: this.selected_skill.id,
				path: target_file,
				content: this.edit_content
			})

			if (this.selected_skill.name !== next_name || this.selected_skill.desc !== next_desc) {
				const skill_file = await rpc.file.read.query({ path: `${skill_path}/SKILL.md` })

				await rpc.skill.update.mutate({
					id: this.selected_skill.id,
					name: next_name,
					desc: next_desc,
					content: skill_file?.contents || this.edit_content,
					type: this.selected_skill.type || undefined
				})
			}
		}

		await this.refresh(selected_file_relative_path)
	}

	async saveSkillInfo() {
		if (!this.selected_skill) {
			return
		}

		const next_name = this.edit_name.trim()
		const next_desc = this.edit_desc.trim()

		if (!next_name) {
			return
		}

		const skill_file = await rpc.file.read.query({ path: `${this.selected_skill.path}/SKILL.md` })

		await rpc.skill.update.mutate({
			id: this.selected_skill.id,
			name: next_name,
			desc: next_desc,
			content: skill_file?.contents || this.edit_content,
			type: this.selected_skill.type || undefined
		})

		this.edit_dialog_open = false

		await this.refresh(this.getRelativeSkillFilePath(this.selected_file?.path || '', this.selected_skill.path))
	}

	async removeSkill(skill_id: string) {
		if (!skill_id) {
			return
		}

		if (this.selected_skill_id === skill_id) {
			this.selected_skill_id = ''
		}

		await rpc.skill.remove.mutate({ id: skill_id })
		this.edit_dialog_open = false

		await this.refresh()
	}

	async sortSkill(from: number, to: number) {
		if (from === to) return
		if (to < 0 || to > this.skill_items.length - 1) return

		this.skill_items = arrayMove(this.skill_items, from, to)

		await rpc.skill.sort.mutate({ from, to })
		await this.refresh()
	}
}

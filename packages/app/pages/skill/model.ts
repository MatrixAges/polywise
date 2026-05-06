import { arrayMove } from '@dnd-kit/sortable'
import { makeAutoObservable } from 'mobx'
import { injectable } from 'tsyringe'

import { Files, Util } from '@/models/common'
import { rpc } from '@/utils'

import type { DetailMode, SkillItem } from './types'

@injectable()
export default class Index {
	skill_items = [] as Array<SkillItem>
	selected_skill_id = ''
	detail_mode = 'preview' as DetailMode
	edit_name = ''
	edit_desc = ''
	edit_content = ''
	file_preview_open = true

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
		makeAutoObservable(this, { util: false, skill_files: false }, { autoBind: true })
	}

	async init() {
		this.util.acts = [() => this.skill_files.reset()]

		await this.refresh()
	}

	deinit() {
		this.util.deinit()
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

	toggleFilePreviewOpen() {
		this.file_preview_open = !this.file_preview_open
	}

	async selectPath(args: { directory: boolean; path: string }) {
		await this.skill_files.selectPath(args)

		if (!args.directory && this.skill_files.select_file) {
			this.edit_content = this.skill_files.select_file.contents
			this.detail_mode = 'preview'
		}
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

	async removeSkill(skill_id: string) {
		if (!skill_id) {
			return
		}

		if (this.selected_skill_id === skill_id) {
			this.selected_skill_id = ''
		}

		await rpc.skill.remove.mutate({ id: skill_id })

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

import { makeAutoObservable } from 'mobx'
import { injectable } from 'tsyringe'

import { rpc } from '@/utils'

interface IArgsLoadDirectory {
	target_path: string
	mode: 'replace' | 'append'
}

interface IArgsSelectPath {
	directory: boolean
	path: string
}

@injectable()
export default class Index {
	dir_only = true
	show_hidden = false
	file_extensions = [] as Array<string>
	paths = [] as Array<string>
	root_path = ''
	input_path = ''
	tree_version = 0
	loaded_path_map = {} as Record<string, boolean>
	select_file_path = ''
	select_file = null as { name: string; contents: string; path: string } | null

	constructor() {
		makeAutoObservable(
			this,
			{ dir_only: false, show_hidden: false, file_extensions: false, loaded_path_map: false },
			{ autoBind: true }
		)
	}

	setInputPath(value: string) {
		this.input_path = value
	}

	getRelativePath(target_path: string) {
		if (!this.root_path) return target_path

		const base_prefix = this.root_path.endsWith('/') ? this.root_path : `${this.root_path}/`

		if (target_path === this.root_path) return ''

		return target_path.startsWith(base_prefix) ? target_path.replace(base_prefix, '') : target_path
	}

	getAbsolutePath(target_path: string) {
		if (!target_path) return this.root_path

		return `${this.root_path}/${target_path}`
	}

	async init(dir: string, options?: Pick<Index, 'dir_only' | 'show_hidden' | 'file_extensions'>) {
		if (options?.dir_only !== undefined) this.dir_only = options.dir_only
		if (options?.show_hidden !== undefined) this.show_hidden = options.show_hidden
		this.file_extensions = options?.file_extensions ? [...options.file_extensions] : []

		this.paths = []
		this.loaded_path_map = {}
		this.tree_version += 1
		this.root_path = dir
		this.input_path = dir
		this.resetSelection()

		await this.loadDirectory({ target_path: dir, mode: 'replace' })
	}

	async selectPath(args: IArgsSelectPath) {
		const { directory, path } = args

		const target_path = this.getAbsolutePath(path)

		if (!directory) {
			this.select_file_path = target_path

			return this.loadFile()
		}

		await this.loadDirectory({ target_path, mode: 'append' })

		this.input_path = target_path
	}

	async fetchPath() {
		const input_path = this.input_path.trim()

		if (!input_path) return

		this.paths = []
		this.loaded_path_map = {}
		this.tree_version += 1
		this.root_path = input_path
		this.input_path = input_path
		this.resetSelection()

		await this.loadDirectory({ target_path: input_path, mode: 'replace' })
	}

	async loadDirectory(args: IArgsLoadDirectory) {
		const { target_path, mode } = args
		const next_path = target_path.trim()

		if (!next_path || !this.root_path) return

		if (mode === 'append' && this.loaded_path_map[next_path]) return

		const list = await rpc.file.list.query({
			path: next_path,
			dir_only: this.dir_only,
			show_hidden: this.show_hidden,
			allowed_extensions: this.file_extensions
		})

		const next_paths = list.map(item => this.getRelativePath(item.dir))
		const current_paths = mode === 'replace' ? [] : this.paths
		const current_loaded_path_map = mode === 'replace' ? {} : this.loaded_path_map

		this.paths = Array.from(new Set([...current_paths, ...next_paths]))
		this.loaded_path_map = { ...current_loaded_path_map, [next_path]: true }
	}

	async loadFile() {
		const res = await rpc.file.read.query({ path: this.select_file_path })

		this.select_file = res
	}

	reset() {
		this.dir_only = true
		this.show_hidden = false
		this.file_extensions = []
		this.paths = []
		this.root_path = ''
		this.input_path = ''
		this.tree_version = 0
		this.loaded_path_map = {}
		this.select_file_path = ''
		this.select_file = null
	}

	resetSelection() {
		this.select_file_path = ''
		this.select_file = null
	}
}

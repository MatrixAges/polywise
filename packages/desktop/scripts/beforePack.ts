import { builtinModules } from 'module'
import path from 'path'
import fs from 'fs-extra'

import type { Configuration } from 'electron-builder'

type PackageJson = {
	dependencies?: Record<string, string>
	optionalDependencies?: Record<string, string>
	exports?: string | Record<string, unknown>
	main?: string
	module?: string
	type?: 'module' | 'commonjs'
}

type TrimCandidate = {
	name: string
	path: string
	size_bytes: number
}

const builtins = new Set(['electron', ...builtinModules.flatMap(name => [name, name.replace(/^node:/, '')])])
const import_patterns = [
	/\bfrom\s*['"]([^'"]+)['"]/g,
	/\bimport\s*['"]([^'"]+)['"]/g,
	/\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
	/\brequire\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
	/new\s+URL\(\s*['"]([^'"]+)['"]\s*,\s*import\.meta\.url\s*\)/g
]
const package_call_pattern = /\b[A-Za-z_$][\w$]*\(\s*['"]([^'"]+)['"]\s*\)/g
const package_like_pattern = /^(@[A-Za-z0-9._-]+\/[A-Za-z0-9._-]+|[A-Za-z0-9][A-Za-z0-9._-]*)(\/[A-Za-z0-9._-]+)*$/
const force_keep_packages = new Set(['archiver', 'unzipper'])

const resolvePackageName = (specifier: string) => {
	if (!specifier || specifier.startsWith('.') || specifier.startsWith('/') || specifier.startsWith('node:')) {
		return null
	}

	if (specifier.startsWith('@')) {
		const [scope, name] = specifier.split('/')

		return scope && name ? `${scope}/${name}` : null
	}

	return specifier.split('/')[0] || null
}

const collectImportedPackages = (target_dir: string, imported_packages: Set<string>) => {
	if (!fs.existsSync(target_dir)) return

	for (const entry of fs.readdirSync(target_dir, { withFileTypes: true })) {
		const entry_path = path.join(target_dir, entry.name)

		if (entry.isDirectory()) {
			collectImportedPackages(entry_path, imported_packages)
			continue
		}

		if (!/\.(m?js|cjs)$/.test(entry.name)) continue

		const source = fs.readFileSync(entry_path, 'utf8')

		for (const pattern of import_patterns) {
			pattern.lastIndex = 0

			let match: RegExpExecArray | null = null

			while ((match = pattern.exec(source))) {
				const package_name = resolvePackageName(match[1])

				if (package_name && !builtins.has(package_name)) {
					imported_packages.add(package_name)
				}
			}
		}
	}
}

const resolvePackageDir = (node_modules_dir: string, package_name: string) => path.join(node_modules_dir, package_name)

const readPackageJson = (package_dir: string): PackageJson | null => {
	const package_json_path = path.join(package_dir, 'package.json')

	if (!fs.existsSync(package_json_path)) return null

	return fs.readJSONSync(package_json_path) as PackageJson
}

const splitPackageSpecifier = (specifier: string) => {
	if (specifier.startsWith('@')) {
		const [scope, name, ...rest] = specifier.split('/')

		return {
			package_name: scope && name ? `${scope}/${name}` : specifier,
			subpath: rest.length > 0 ? `./${rest.join('/')}` : '.'
		}
	}

	const [name, ...rest] = specifier.split('/')

	return {
		package_name: name,
		subpath: rest.length > 0 ? `./${rest.join('/')}` : '.'
	}
}

const resolveExportTarget = (value: unknown, subpath: string): string | null => {
	if (typeof value === 'string') return value

	if (Array.isArray(value)) {
		for (const item of value) {
			const resolved = resolveExportTarget(item, subpath)

			if (resolved) return resolved
		}

		return null
	}

	if (!value || typeof value !== 'object') return null

	const record = value as Record<string, unknown>

	if (subpath !== '.' && subpath in record) {
		const resolved = resolveExportTarget(record[subpath], '.')

		if (resolved) return resolved
	}

	if (subpath === '.' && '.' in record) {
		const resolved = resolveExportTarget(record['.'], '.')

		if (resolved) return resolved
	}

	for (const key of ['electron', 'node', 'require', 'import', 'default']) {
		if (!(key in record)) continue

		const resolved = resolveExportTarget(record[key], subpath)

		if (resolved) return resolved
	}

	return null
}

const listTopLevelPackages = (node_modules_dir: string) => {
	const packages: Array<{ name: string; path: string }> = []

	for (const entry of fs.readdirSync(node_modules_dir, { withFileTypes: true })) {
		if (entry.name.startsWith('.')) continue
		if (!entry.isDirectory()) continue

		const entry_path = path.join(node_modules_dir, entry.name)

		if (entry.name.startsWith('@')) {
			for (const scoped_entry of fs.readdirSync(entry_path, { withFileTypes: true })) {
				if (!scoped_entry.isDirectory()) continue

				packages.push({
					name: `${entry.name}/${scoped_entry.name}`,
					path: path.join(entry_path, scoped_entry.name)
				})
			}

			continue
		}

		packages.push({ name: entry.name, path: entry_path })
	}

	return packages.sort((left, right) => left.name.localeCompare(right.name))
}

const getDirectorySize = (target_path: string): number => {
	const stat = fs.lstatSync(target_path)

	if (stat.isSymbolicLink()) return 0
	if (stat.isFile()) return stat.size
	if (!stat.isDirectory()) return 0

	return fs
		.readdirSync(target_path, { withFileTypes: true })
		.reduce((total, entry) => total + getDirectorySize(path.join(target_path, entry.name)), 0)
}

const formatSize = (size_bytes: number) => `${(size_bytes / 1024 / 1024).toFixed(2)} MB`

const removeEmptyScopeDir = (package_dir: string) => {
	const scope_dir = path.dirname(package_dir)

	if (!path.basename(scope_dir).startsWith('@')) return

	const remaining = fs.readdirSync(scope_dir)

	if (remaining.length === 0) {
		fs.removeSync(scope_dir)
	}
}

const resolvePathCandidates = (base_path: string) => {
	const candidates = [
		base_path,
		`${base_path}.js`,
		`${base_path}.cjs`,
		`${base_path}.mjs`,
		`${base_path}.json`,
		path.join(base_path, 'index.js'),
		path.join(base_path, 'index.cjs'),
		path.join(base_path, 'index.mjs'),
		path.join(base_path, 'index.json')
	]

	return [...new Set(candidates)]
}

const resolveFilePath = (base_path: string): string | null => {
	for (const candidate of resolvePathCandidates(base_path)) {
		if (!fs.existsSync(candidate)) continue

		const stat = fs.statSync(candidate)

		if (stat.isFile()) return candidate

		if (stat.isDirectory()) {
			const package_json = readPackageJson(candidate)

			if (package_json) {
				const entry = package_json.main ?? package_json.module

				if (entry) {
					const nested = resolveFilePath(path.join(candidate, entry))

					if (nested) return nested
				}
			}
		}
	}

	return null
}

const resolvePackageEntry = (
	node_modules_dir: string,
	specifier: string
): { package_name: string; file_path: string | null } | null => {
	const { package_name, subpath } = splitPackageSpecifier(specifier)
	const package_dir = resolvePackageDir(node_modules_dir, package_name)

	if (!fs.existsSync(package_dir)) {
		return null
	}

	const package_json = readPackageJson(package_dir)

	if (!package_json) {
		return {
			package_name,
			file_path: resolveFilePath(path.join(package_dir, subpath === '.' ? 'index' : subpath))
		}
	}

	const export_target = resolveExportTarget(package_json.exports, subpath)

	if (export_target) {
		return {
			package_name,
			file_path: resolveFilePath(path.join(package_dir, export_target))
		}
	}

	if (subpath !== '.') {
		return {
			package_name,
			file_path: resolveFilePath(path.join(package_dir, subpath))
		}
	}

	const main_target = package_json.main ?? package_json.module ?? 'index.js'

	return {
		package_name,
		file_path: resolveFilePath(path.join(package_dir, main_target))
	}
}

const resolveRelativeImport = (from_file: string, specifier: string) => {
	const base_path = path.resolve(path.dirname(from_file), specifier)

	return resolveFilePath(base_path)
}

const keepInstalledOptionalDependencies = (node_modules_dir: string, keep_packages: Set<string>) => {
	const queue = [...keep_packages]
	const visited = new Set<string>()
	const added_packages: Array<string> = []

	while (queue.length > 0) {
		const package_name = queue.shift()

		if (!package_name || visited.has(package_name)) continue

		visited.add(package_name)

		const package_json = readPackageJson(resolvePackageDir(node_modules_dir, package_name))

		if (!package_json?.optionalDependencies) continue

		for (const dependency_name of Object.keys(package_json.optionalDependencies)) {
			const dependency_dir = resolvePackageDir(node_modules_dir, dependency_name)

			if (!fs.existsSync(dependency_dir)) continue
			if (keep_packages.has(dependency_name)) continue

			keep_packages.add(dependency_name)
			added_packages.push(dependency_name)
			queue.push(dependency_name)
		}
	}

	return added_packages
}

const buildKeepSetFromFileGraph = (app_dir: string) => {
	const node_modules_dir = path.join(app_dir, 'node_modules')
	const keep_packages = new Set<string>(['polywise', ...force_keep_packages])
	const scanned_files = new Set<string>()
	const missing_resolutions = new Set<string>()
	const queue = [
		path.join(app_dir, 'dist', 'index.js'),
		path.join(node_modules_dir, 'polywise', 'dist', 'index.js')
	].filter(file_path => fs.existsSync(file_path))

	const enqueuePackageSpecifier = (owner_file: string, specifier: string) => {
		if (!specifier || specifier.startsWith('node:')) return

		if (specifier.startsWith('.') || specifier.startsWith('/')) {
			const resolved_file = resolveRelativeImport(owner_file, specifier)

			if (resolved_file) {
				queue.push(resolved_file)
			} else {
				missing_resolutions.add(`${owner_file} -> ${specifier}`)
			}

			return
		}

		const resolved_package = resolvePackageEntry(node_modules_dir, specifier)

		if (!resolved_package) {
			missing_resolutions.add(`${owner_file} -> ${specifier}`)
			return
		}

		keep_packages.add(resolved_package.package_name)

		if (resolved_package.file_path) {
			queue.push(resolved_package.file_path)
		} else {
			missing_resolutions.add(`${owner_file} -> ${specifier}`)
		}
	}

	const scanFile = (file_path: string) => {
		const normalized_path = path.normalize(file_path)

		if (scanned_files.has(normalized_path)) return
		if (!fs.existsSync(normalized_path)) return
		if (!/\.(m?js|cjs)$/.test(normalized_path)) return

		scanned_files.add(normalized_path)

		const source = fs.readFileSync(normalized_path, 'utf8')

		for (const pattern of import_patterns) {
			pattern.lastIndex = 0

			let match: RegExpExecArray | null = null

			while ((match = pattern.exec(source))) {
				enqueuePackageSpecifier(normalized_path, match[1])
			}
		}

		package_call_pattern.lastIndex = 0

		let package_call_match: RegExpExecArray | null = null

		while ((package_call_match = package_call_pattern.exec(source))) {
			const specifier = package_call_match[1]

			if (!package_like_pattern.test(specifier)) continue
			if (builtins.has(specifier)) continue

			const package_name = resolvePackageName(specifier)

			if (!package_name) continue
			if (!fs.existsSync(resolvePackageDir(node_modules_dir, package_name))) continue

			enqueuePackageSpecifier(normalized_path, specifier)
		}
	}

	while (queue.length > 0) {
		const next_file = queue.shift()

		if (!next_file) continue

		scanFile(next_file)
	}

	const optional_packages = keepInstalledOptionalDependencies(node_modules_dir, keep_packages)

	return {
		keep_packages,
		scanned_files,
		missing_resolutions,
		optional_packages
	}
}

const resolvePackagedAppDir = (app_out_dir: string) => {
	const candidates = new Set<string>([
		app_out_dir,
		path.join(app_out_dir, 'resources', 'app'),
		path.join(app_out_dir, 'Resources', 'app')
	])

	if (app_out_dir.endsWith('.app')) {
		candidates.add(path.join(app_out_dir, 'Contents', 'Resources', 'app'))
	}

	if (fs.existsSync(app_out_dir)) {
		for (const entry of fs.readdirSync(app_out_dir, { withFileTypes: true })) {
			if (!entry.isDirectory() || !entry.name.endsWith('.app')) continue

			candidates.add(path.join(app_out_dir, entry.name, 'Contents', 'Resources', 'app'))
		}
	}

	console.log(`[Cleanup] appOutDir: ${app_out_dir}`)

	for (const candidate of candidates) {
		const node_modules_dir = path.join(candidate, 'node_modules')
		const exists = fs.existsSync(candidate)
		const has_node_modules = fs.existsSync(node_modules_dir)

		console.log(`[Cleanup] candidate: ${candidate} | exists=${exists} | node_modules=${has_node_modules}`)

		if (has_node_modules) {
			console.log(`[Cleanup] Resolved packaged app dir: ${candidate}`)
			return candidate
		}
	}

	console.warn('[Cleanup] Unable to resolve packaged app dir from appOutDir.')
	return null
}

const trimUnusedPackages = (app_dir: string) => {
	const node_modules_dir = path.join(app_dir, 'node_modules')

	if (!fs.existsSync(node_modules_dir)) {
		console.warn(`[Cleanup] node_modules not found: ${node_modules_dir}`)
		return
	}

	const imported_packages = new Set<string>()

	collectImportedPackages(path.join(app_dir, 'dist'), imported_packages)
	collectImportedPackages(path.join(node_modules_dir, 'polywise', 'dist'), imported_packages)

	const { keep_packages, scanned_files, missing_resolutions, optional_packages } =
		buildKeepSetFromFileGraph(app_dir)
	const trim_candidates: Array<TrimCandidate> = listTopLevelPackages(node_modules_dir)
		.filter(entry => !keep_packages.has(entry.name))
		.map(entry => ({
			name: entry.name,
			path: entry.path,
			size_bytes: getDirectorySize(entry.path)
		}))
		.sort((left, right) => right.size_bytes - left.size_bytes)

	if (trim_candidates.length === 0) {
		console.log('[Cleanup] No unused node_modules packages detected.')
		return
	}

	const total_saved = trim_candidates.reduce((sum, entry) => sum + entry.size_bytes, 0)

	console.log(
		`[Cleanup] imported=${imported_packages.size} scanned_files=${scanned_files.size} keep=${keep_packages.size} removable=${trim_candidates.length}`
	)

	if (optional_packages.length > 0) {
		console.log(
			`[Cleanup] kept optional platform/runtime packages: ${optional_packages.slice(0, 20).join(', ')}${optional_packages.length > 20 ? ' ...' : ''}`
		)
	}

	if (missing_resolutions.size > 0) {
		console.log(`[Cleanup] unresolved imports: ${missing_resolutions.size}`)
	}

	console.log(
		`[Cleanup] Trimming ${trim_candidates.length} unused packages from ${node_modules_dir} (${formatSize(total_saved)}).`
	)

	for (const candidate of trim_candidates) {
		fs.removeSync(candidate.path)
		removeEmptyScopeDir(candidate.path)
		console.log(`[Cleanup] Removed unused package: ${candidate.name} (${formatSize(candidate.size_bytes)})`)
	}
}

export const afterPack: Configuration['afterPack'] = async context => {
	const app_dir = resolvePackagedAppDir(context.appOutDir)

	console.log('-----------')
	console.log(`[Cleanup] Preparing packaged app dir from: ${context.appOutDir}`)
	console.log('-----------')

	if (!app_dir) {
		return
	}

	trimUnusedPackages(app_dir)
}

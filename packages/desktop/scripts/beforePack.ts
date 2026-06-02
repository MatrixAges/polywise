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
const js_file_pattern = /\.(m?js|cjs)$/
const package_name_pattern = /^(@[A-Za-z0-9._-]+\/[A-Za-z0-9._-]+|[A-Za-z0-9][A-Za-z0-9._-]*)$/

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

const listJavaScriptFiles = (target_dir: string, filter?: (file_path: string) => boolean): Array<string> => {
	if (!fs.existsSync(target_dir)) return []

	const files: Array<string> = []

	for (const entry of fs.readdirSync(target_dir, { withFileTypes: true })) {
		const entry_path = path.join(target_dir, entry.name)

		if (entry.isDirectory()) {
			files.push(...listJavaScriptFiles(entry_path, filter))
			continue
		}

		if (!js_file_pattern.test(entry.name)) continue
		if (filter && !filter(entry_path)) continue

		files.push(entry_path)
	}

	return files
}

const resolvePolywiseConfigPath = () => {
	const candidates = [
		path.resolve(process.cwd(), '../polywise/rslib.config.ts'),
		path.resolve(process.cwd(), 'packages/polywise/rslib.config.ts')
	]

	for (const candidate of candidates) {
		if (fs.existsSync(candidate)) return candidate
	}

	return null
}

const readPolywiseExternalPackages = () => {
	const config_path = resolvePolywiseConfigPath()

	if (!config_path) {
		console.warn('[Cleanup] polywise rslib.config.ts not found, skipping explicit external keep list.')
		return [] as Array<string>
	}

	const config_source = fs.readFileSync(config_path, 'utf8')
	const packages = new Set<string>()

	for (const line of config_source.split('\n')) {
		const regex_match = line.match(/\/\^([^$]+)\$\/\s*,?\s*$/)

		if (regex_match) {
			const package_name = regex_match[1].replace(/\\\//g, '/').replace(/\(\/\.\*\)\?$/, '')

			if (package_name_pattern.test(package_name)) {
				packages.add(package_name)
			}

			continue
		}

		const object_match = line.match(/\{\s*['"]([^'"]+)['"]\s*:/)

		if (object_match && package_name_pattern.test(object_match[1])) {
			packages.add(object_match[1])
		}
	}

	return [...packages].sort()
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

const buildKeepSetFromRuntimeGraph = (app_dir: string) => {
	const node_modules_dir = path.join(app_dir, 'node_modules')
	const polywise_dist_dir = path.join(node_modules_dir, 'polywise', 'dist')
	const polywise_external_packages = readPolywiseExternalPackages()
	const keep_packages = new Set<string>(['polywise'])
	const referenced_packages = new Set<string>()
	const scanned_files = new Set<string>()
	const missing_resolutions = new Set<string>()
	const queue = [
		...listJavaScriptFiles(path.join(app_dir, 'dist')),
		...listJavaScriptFiles(polywise_dist_dir, file_path => path.basename(file_path) !== 'cli.js')
	]

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

		const package_name = resolvePackageName(specifier)

		if (!package_name || !package_name_pattern.test(package_name)) {
			return
		}

		const resolved_package = resolvePackageEntry(node_modules_dir, specifier)

		if (!resolved_package) {
			missing_resolutions.add(`${owner_file} -> ${specifier}`)
			return
		}

		keep_packages.add(resolved_package.package_name)
		referenced_packages.add(package_name)

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

		const require_factory_pattern = /\b([A-Za-z_$][\w$]*)\s*=\s*[A-Za-z_$][\w$]*\(\s*import\.meta\.url\s*\)/g
		let factory_match: RegExpExecArray | null = null

		while ((factory_match = require_factory_pattern.exec(source))) {
			const require_name = factory_match[1]
			const escaped_require_name = require_name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
			const require_call_pattern = new RegExp(
				`\\b${escaped_require_name}\\(\\s*['"]([^'"]+)['"]\\s*\\)`,
				'g'
			)
			let require_call_match: RegExpExecArray | null = null

			while ((require_call_match = require_call_pattern.exec(source))) {
				enqueuePackageSpecifier(normalized_path, require_call_match[1])
			}
		}

		const inline_require_pattern = /[A-Za-z_$][\w$]*\(\s*import\.meta\.url\s*\)\(\s*['"]([^'"]+)['"]\s*\)/g
		let inline_require_match: RegExpExecArray | null = null

		while ((inline_require_match = inline_require_pattern.exec(source))) {
			enqueuePackageSpecifier(normalized_path, inline_require_match[1])
		}
	}

	for (const package_name of polywise_external_packages) {
		const resolved_package = resolvePackageEntry(node_modules_dir, package_name)

		if (!resolved_package) {
			missing_resolutions.add(`[polywise externals] -> ${package_name}`)
			continue
		}

		keep_packages.add(resolved_package.package_name)
		referenced_packages.add(resolved_package.package_name)

		if (resolved_package.file_path) {
			queue.push(resolved_package.file_path)
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
		referenced_packages,
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

	const { keep_packages, referenced_packages, scanned_files, missing_resolutions, optional_packages } =
		buildKeepSetFromRuntimeGraph(app_dir)
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
		`[Cleanup] referenced=${referenced_packages.size} scanned_files=${scanned_files.size} keep=${keep_packages.size} removable=${trim_candidates.length}`
	)

	if (referenced_packages.size > 0) {
		console.log(`[Cleanup] runtime externals: ${[...referenced_packages].sort().join(', ')}`)
	}

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

const shouldPruneDarwinArm64Packages = () =>
	process.platform === 'darwin' && process.arch === 'arm64' && process.env.BUILD_ARCH === 'x64'

const pruneMismatchedDarwinPackages = (app_dir: string) => {
	if (!shouldPruneDarwinArm64Packages()) return

	const node_modules_dir = path.join(app_dir, 'node_modules')

	if (!fs.existsSync(node_modules_dir)) return

	const trim_candidates = listTopLevelPackages(node_modules_dir).filter(entry =>
		entry.name.endsWith('-darwin-arm64')
	)

	for (const candidate of trim_candidates) {
		const x64_name = candidate.name.replace(/-darwin-arm64$/, '-darwin-x64')
		const universal_name = candidate.name.replace(/-darwin-arm64$/, '-darwin-universal')
		const has_x64_variant = fs.existsSync(resolvePackageDir(node_modules_dir, x64_name))
		const has_universal_variant = fs.existsSync(resolvePackageDir(node_modules_dir, universal_name))

		if (!has_x64_variant && !has_universal_variant) {
			console.warn(
				`[Cleanup] Keeping ${candidate.name} because no x64/universal variant exists in packaged node_modules.`
			)
			continue
		}

		fs.removeSync(candidate.path)
		removeEmptyScopeDir(candidate.path)
		console.log(`[Cleanup] Removed mismatched Darwin arm64 package for x64 build: ${candidate.name}`)
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
	pruneMismatchedDarwinPackages(app_dir)
}

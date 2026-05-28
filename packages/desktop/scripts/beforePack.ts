import { builtinModules } from 'module'
import path from 'path'
import fs from 'fs-extra'

import type { Configuration } from 'electron-builder'

type PackageJson = {
	dependencies?: Record<string, string>
	optionalDependencies?: Record<string, string>
	peerDependencies?: Record<string, string>
	peerDependenciesMeta?: Record<string, { optional?: boolean }>
	bundleDependencies?: Array<string>
	bundledDependencies?: Array<string>
}

type TrimCandidate = {
	name: string
	path: string
	size_bytes: number
}

const builtins = new Set(builtinModules.flatMap(name => [name, name.replace(/^node:/, '')]))
const import_patterns = [
	/\bfrom\s+['"]([^'"]+)['"]/g,
	/\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
	/\brequire\s*\(\s*['"]([^'"]+)['"]\s*\)/g
]

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

const collectDependencyNames = (package_json: PackageJson) => {
	const names = new Set<string>()

	for (const key of Object.keys(package_json.dependencies ?? {})) {
		names.add(key)
	}

	for (const key of Object.keys(package_json.optionalDependencies ?? {})) {
		names.add(key)
	}

	for (const key of package_json.bundleDependencies ?? []) {
		names.add(key)
	}

	for (const key of package_json.bundledDependencies ?? []) {
		names.add(key)
	}

	for (const key of Object.keys(package_json.peerDependencies ?? {})) {
		if (package_json.peerDependenciesMeta?.[key]?.optional) continue
		names.add(key)
	}

	return [...names]
}

const buildKeepSet = (node_modules_dir: string, imported_packages: Set<string>) => {
	const queue = [...new Set(['polywise', ...imported_packages])]
	const keep = new Set<string>()

	while (queue.length > 0) {
		const package_name = queue.shift()

		if (!package_name || keep.has(package_name) || builtins.has(package_name)) {
			continue
		}

		const package_dir = resolvePackageDir(node_modules_dir, package_name)

		if (!fs.existsSync(package_dir)) {
			continue
		}

		const package_json = readPackageJson(package_dir)

		keep.add(package_name)

		if (!package_json) {
			console.warn(`[Cleanup] Missing package.json for ${package_name}, preserving it.`)
			continue
		}

		for (const dependency_name of collectDependencyNames(package_json)) {
			const dependency_dir = resolvePackageDir(node_modules_dir, dependency_name)

			if (fs.existsSync(dependency_dir) && !keep.has(dependency_name)) {
				queue.push(dependency_name)
			}
		}
	}

	return keep
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

const trimUnusedPackages = (app_dir: string) => {
	const node_modules_dir = path.join(app_dir, 'node_modules')

	if (!fs.existsSync(node_modules_dir)) return

	const imported_packages = new Set<string>()

	collectImportedPackages(path.join(app_dir, 'dist'), imported_packages)
	collectImportedPackages(path.join(node_modules_dir, 'polywise', 'dist'), imported_packages)

	const keep = buildKeepSet(node_modules_dir, imported_packages)
	const trim_candidates: Array<TrimCandidate> = listTopLevelPackages(node_modules_dir)
		.filter(entry => !keep.has(entry.name))
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
		`[Cleanup] Trimming ${trim_candidates.length} unused packages from ${node_modules_dir} (${formatSize(total_saved)}).`
	)

	for (const candidate of trim_candidates) {
		fs.removeSync(candidate.path)
		removeEmptyScopeDir(candidate.path)
		console.log(`[Cleanup] Removed unused package: ${candidate.name} (${formatSize(candidate.size_bytes)})`)
	}
}

export const beforePack: Configuration['beforePack'] = async context => {
	const app_dir = context.appOutDir

	console.log('-----------')
	console.log(`[Cleanup] Preparing app dir: ${app_dir}`)
	console.log('-----------')

	trimUnusedPackages(app_dir)
}

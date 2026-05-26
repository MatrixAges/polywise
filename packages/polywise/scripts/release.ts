import { readFile, writeFile } from 'node:fs/promises'
import { relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const versions = {
	polywise: '',
	app: '',
	desktop: ''
} as const

const package_json_map = {
	polywise: new URL('../package.json', import.meta.url),
	app: new URL('../../app/package.json', import.meta.url),
	desktop: new URL('../../desktop/package.json', import.meta.url)
} as const

const detectIndent = (content: string) => content.match(/\n([ \t]+)"/)?.[1] || '\t'

const ensureVersion = (name: keyof typeof versions, value: string) => {
	if (!value.trim()) {
		throw new Error(`Please set versions.${name} before running this script.`)
	}

	return value.trim()
}

const updatePackageVersion = async (name: keyof typeof versions, version: string) => {
	const file_url = package_json_map[name]
	const file_path = fileURLToPath(file_url)
	const raw = await readFile(file_url, 'utf-8')
	const data = JSON.parse(raw) as { version?: unknown }

	if (typeof data.version !== 'string') {
		throw new Error(`Missing string version field in ${file_path}`)
	}

	data.version = version

	await writeFile(file_url, `${JSON.stringify(data, null, detectIndent(raw))}\n`, 'utf-8')
	console.log(`${relative(process.cwd(), file_path)} -> ${version}`)
}

for (const [name, value] of Object.entries(versions) as Array<[keyof typeof versions, string]>) {
	await updatePackageVersion(name, ensureVersion(name, value))
}

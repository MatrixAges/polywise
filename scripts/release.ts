import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const version = '0.1.0'
const items = ['polywise', 'app', 'desktop']

const updateVersion = async (name: string) => {
	const file_path = resolve(`${process.cwd()}/packages/${name}/package.json`)
	const raw = await readFile(file_path, 'utf-8')
	const data = JSON.parse(raw) as { version?: unknown }

	data.version = version

	await writeFile(file_path, `${JSON.stringify(data, null, 6)}`, 'utf-8')

	console.log(`${file_path} -> ${version}`)
}

items.forEach(item => updateVersion(item))

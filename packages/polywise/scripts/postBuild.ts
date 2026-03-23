import { resolve } from 'path'
import { readFile, writeFile } from 'fs-extra'
import { globby } from 'globby'

const paths = await globby(resolve(`${process.cwd()}/dist/**/*.js`))

for (const filePath of paths) {
	const content = await readFile(filePath, 'utf-8')

	if (content.includes('entityKind;')) {
		const newContent = content.replace(/entityKind;/g, '')

		await writeFile(filePath, newContent, 'utf-8')

		console.log(`✅ Cleaned: ${filePath}`)
	}
}

import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { globbySync } from 'globby'
import { Document } from 'flexsearch'
import { fromMarkdown } from 'mdast-util-from-markdown'
import { mdxFromMarkdown } from 'mdast-util-mdx'
import { mdxjs } from 'micromark-extension-mdxjs'
import { nanoid } from 'nanoid'
import lzString from 'lz-string'

const { compressToUTF16 } = lzString

const contentDir = `${process.cwd()}/content/docs`
const searchDir = `${process.cwd()}/public/search`
const docPaths = [
	'intro',
	'config',
	'providers',
	'troubleshooting',
	'cli',
	'web',
	'desktop',
	'capture_contents',
	'agent_private_contents',
	'group_chat',
	'project_workspace',
	'im_integration',
	'content_service_providers',
	'fst',
	'memory_callback',
	'post_think',
	'rewire_mechanisms'
]

const docsByLocale = {
	en: docPaths.map(path => `${path}/en.mdx`),
	zh: docPaths.map(path => {
		const target = `${path}/zh.mdx`
		return globbySync([target], { cwd: contentDir }).length ? target : `${path}/en.mdx`
	}),
	ja: docPaths.map(path => {
		const target = `${path}/ja.mdx`
		return globbySync([target], { cwd: contentDir }).length ? target : `${path}/en.mdx`
	})
}

const commonOptions = {
	cache: 100,
	tokenize: 'full',
	document: {
		id: 'id',
		index: 'content',
		store: true
	},
	context: {
		resolution: 9,
		depth: 3,
		bidirectional: true
	}
}

const getText = item => {
	if ('children' in item) {
		return item.children.reduce((total, child) => {
			if ('children' in child) {
				total += getText(child)
			} else if ('value' in child) {
				total += child.value
			}

			return total
		}, '')
	}

	if ('value' in item) {
		return item.value
	}

	return ''
}

const addIndexRow = (indexes, link, headings, content, type = 'content') => {
	if (!content) return

	indexes.add({
		id: nanoid(6),
		link,
		type,
		headings: headings.map(item => item.title).join('>'),
		content
	})
}

const getElementText = (item, context) => {
	const { indexes, link, headings } = context

	switch (item.name) {
		case 'Tabs': {
			const value = item.attributes[0]?.value
			const statement = value?.data?.estree?.body?.[0]
			const elements = statement?.expression?.elements ?? []

			elements.forEach(el => {
				const propChildren = el.properties?.at?.(-1)
				const raw = propChildren?.value?.quasis?.[0]?.value?.raw ?? ''

				raw.split('\n').forEach(line => addIndexRow(indexes, link, headings, line))
			})
			break
		}

		case 'ImageLayout':
		case 'Row':
			item.children?.forEach(child => {
				if (child.type === 'mdxJsxFlowElement' && child.children) {
					child.children.forEach(grandChild =>
						addIndexRow(indexes, link, headings, getText(grandChild))
					)
				} else {
					addIndexRow(indexes, link, headings, getText(child))
				}
			})
			break

		case 'Alert':
			addIndexRow(
				indexes,
				link,
				headings,
				typeof item.attributes.at(-1)?.value === 'string' ? item.attributes.at(-1).value : ''
			)
			break

		default:
			break
	}
}

const buildLocaleIndex = async locale => {
	const indexes = new Document(commonOptions)
	const docs = docsByLocale[locale] ?? []

	for (const docPath of docs) {
		const link = docPath.replace(/\/(en|zh|ja)\.mdx$/, '')
		const doc = readFileSync(`${contentDir}/${docPath}`)
		const ast = fromMarkdown(doc, { extensions: [mdxjs()], mdastExtensions: [mdxFromMarkdown()] })
		const headings = []

		for (const item of ast.children) {
			const previous = headings.at(-1)

			if (item.type === 'heading') {
				if (!previous) {
					headings.push({ title: getText(item), level: item.depth })
				} else if (previous.level < item.depth) {
					headings.push({ title: getText(item), level: item.depth })
				} else {
					while (headings.length && headings.at(-1).level >= item.depth) {
						headings.pop()
					}

					headings.push({ title: getText(item), level: item.depth })
				}

				addIndexRow(indexes, link, headings, getText(item), 'heading')
				continue
			}

			if (item.type === 'mdxJsxFlowElement') {
				getElementText(item, { indexes, link, headings })
				continue
			}

			const content = getText(item)

			if (!content) continue

			content.split('\n').forEach(line => addIndexRow(indexes, link, headings, line))
		}
	}

	const exportIndex = {}

	await indexes.export((id, value) => {
		if (value) {
			exportIndex[id] = value
		}
	})

	writeFileSync(`${searchDir}/${locale}`, compressToUTF16(JSON.stringify(exportIndex)))
}

mkdirSync(searchDir, { recursive: true })
rmSync(searchDir, { recursive: true, force: true })
mkdirSync(searchDir, { recursive: true })

await Promise.all(Object.keys(docsByLocale).map(buildLocaleIndex))

writeFileSync(`${searchDir}/timestamp`, Date.now().toString())

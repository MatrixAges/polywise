import { Color } from '@tiptap/extension-color'
import { Details, DetailsContent, DetailsSummary } from '@tiptap/extension-details'
import Highlight from '@tiptap/extension-highlight'
import Image from '@tiptap/extension-image'
import { ListKit } from '@tiptap/extension-list'
import Math from '@tiptap/extension-mathematics'
import { TableKit } from '@tiptap/extension-table'
import { getHierarchicalIndexes, TableOfContents } from '@tiptap/extension-table-of-contents'
import { TextStyle } from '@tiptap/extension-text-style'
import Typography from '@tiptap/extension-typography'
import { CharacterCount } from '@tiptap/extensions'
import { Markdown } from '@tiptap/markdown'
import StarterKit from '@tiptap/starter-kit'
import { pick } from 'es-toolkit'

import { CodeBlock, Mermaid } from './nodes'

import type { EditorOptions } from '@tiptap/core'
import type { Toc } from './types'

interface Args {
	id: string
	setToc: (v: Toc) => void
}

const getCharacterCount = (text: string) => {
	const cjk_count = (text.match(/[\u3400-\u9fff]/g) ?? []).length
	const latin_count = text
		.replace(/[\u3400-\u9fff]/g, ' ')
		.replace(/[^A-Za-z0-9]+/g, ' ')
		.trim()
		.split(/\s+/)
		.filter(Boolean).length

	return cjk_count + latin_count
}

export default (args: Args) => {
	const { id, setToc } = args

	return [
		Markdown,
		StarterKit.configure({
			codeBlock: false,
			bulletList: false,
			listItem: false,
			listKeymap: false,
			orderedList: false,
			link: { openOnClick: false, defaultProtocol: 'https' }
		}),
		ListKit.configure({
			taskItem: { nested: true }
		}),
		TableKit.configure({
			table: { resizable: true }
		}),
		Highlight.configure({
			multicolor: true
		}),
		Math.configure({
			blockOptions: {
				onClick: (node, pos) => {
					window.$app.Event.emit(`${id}/editor/ShowModal`, {
						type: 'function',
						context: { value: node.attrs.latex, pos }
					})
				}
			},
			inlineOptions: {
				onClick: (node, pos) => {
					window.$app.Event.emit(`${id}/editor/ShowModal`, {
						type: 'function',
						context: { value: node.attrs.latex, pos, inline: true }
					})
				}
			}
		}),
		TableOfContents.configure({
			getIndex: getHierarchicalIndexes,
			onUpdate(content) {
				setToc(
					content.map(item =>
						pick(item, [
							'id',
							'level',
							'textContent',
							'itemIndex',
							'isActive',
							'isScrolledOver'
						])
					)
				)
			}
		}),
		Details.configure({
			HTMLAttributes: {
				class: 'details'
			}
		}),
		DetailsContent,
		DetailsSummary,
		Typography,
		Image,
		TextStyle,
		Color,
		CharacterCount.configure({
			textCounter: getCharacterCount
		}),
		CodeBlock,
		Mermaid
	] as EditorOptions['extensions']
}

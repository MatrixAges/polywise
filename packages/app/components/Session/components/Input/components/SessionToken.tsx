import { createInlineMarkdownSpec, InputRule, mergeAttributes, Node, nodePasteRule } from '@tiptap/core'
import { NodeViewWrapper, ReactNodeViewRenderer } from '@tiptap/react'
import { BookMarked, Bot, Container, Server } from 'lucide-react'

import getToolIcon from '@/utils/getToolIcon'

import { getBasename, getFileIcon } from '../utils'

import type { NodeViewProps } from '@tiptap/core'
import type { FileMentionItem, SessionTokenAttrs } from '../types'

const mention_token_pattern = /^\[(AGENT|SKILL|TOOL|FILE|MCP):\s*([^\]\n]+?)\]/
const reference_token_pattern = /^REFERENCE:\s*\[(\d+)\s*,\s*(\d+)\]/
const mention_input_pattern = /(?:^|\s)(\[(AGENT|SKILL|TOOL|FILE|MCP):\s*([^\]\n]+?)\])$/
const reference_input_pattern = /(?:^|\s)(REFERENCE:\s*\[(\d+)\s*,\s*(\d+)\])$/
const mention_paste_pattern = /\[(AGENT|SKILL|TOOL|FILE|MCP):\s*([^\]\n]+?)\]/g
const reference_paste_pattern = /REFERENCE:\s*\[(\d+)\s*,\s*(\d+)\]/g

const markdown_spec = createInlineMarkdownSpec({
	nodeName: 'sessionToken',
	selfClosing: true,
	allowedAttributes: ['tokenType', 'label', 'refStart', 'refEnd']
})

const getFileKind = (label: string) => (label.endsWith('/') ? 'directory' : 'file')

const getTokenIcon = (attrs: SessionTokenAttrs) => {
	if (attrs.tokenType === 'agent') return Bot
	if (attrs.tokenType === 'skill') return Container
	if (attrs.tokenType === 'mcp') return Server
	if (attrs.tokenType === 'reference') return BookMarked
	if (attrs.tokenType === 'file') {
		return getFileIcon({
			key: attrs.label,
			type: 'file',
			label: attrs.label,
			path: attrs.label,
			basename: getBasename(attrs.label),
			file_kind: getFileKind(attrs.label),
			search_text: attrs.label.toLowerCase()
		} satisfies FileMentionItem)
	}

	return getToolIcon(attrs.label)
}

const getReferenceLabel = (attrs: SessionTokenAttrs) =>
	attrs.refStart !== null && attrs.refEnd !== null ? `[${attrs.refStart},${attrs.refEnd}]` : attrs.label

const getTokenMarkdown = (attrs: SessionTokenAttrs) => {
	if (attrs.tokenType === 'reference') {
		return `REFERENCE: [${attrs.refStart ?? 0},${attrs.refEnd ?? 0}]`
	}

	if (attrs.tokenType === 'file') {
		return `[FILE: ${attrs.label}]`
	}

	if (attrs.tokenType === 'mcp') {
		return `[MCP: ${attrs.label}]`
	}

	return `[${attrs.tokenType.toUpperCase()}: ${attrs.label}]`
}

const parseMentionMatch = (match: RegExpMatchArray): SessionTokenAttrs => ({
	tokenType: match[1].toLowerCase() as SessionTokenAttrs['tokenType'],
	label: match[2].trim(),
	refStart: null,
	refEnd: null
})

const parseReferenceMatch = (match: RegExpMatchArray): SessionTokenAttrs => ({
	tokenType: 'reference',
	label: `[${match[1]},${match[2]}]`,
	refStart: Number(match[1]),
	refEnd: Number(match[2])
})

const parseInputMentionMatch = (match: RegExpMatchArray): SessionTokenAttrs => ({
	tokenType: match[2].toLowerCase() as SessionTokenAttrs['tokenType'],
	label: match[3].trim(),
	refStart: null,
	refEnd: null
})

const parseInputReferenceMatch = (match: RegExpMatchArray): SessionTokenAttrs => ({
	tokenType: 'reference',
	label: `[${match[2]},${match[3]}]`,
	refStart: Number(match[2]),
	refEnd: Number(match[3])
})

const SessionTokenView = ({ node }: NodeViewProps) => {
	const attrs = node.attrs as SessionTokenAttrs
	const Icon = getTokenIcon(attrs)
	const display_label =
		attrs.tokenType === 'reference'
			? getReferenceLabel(attrs)
			: attrs.tokenType === 'file'
				? getBasename(attrs.label)
				: attrs.label

	return (
		<NodeViewWrapper
			as='span'
			contentEditable={false}
			className='
				inline-flex
				items-center
				max-w-full
				gap-1
				px-1.5 py-0.5
				mx-1
				rounded-[5px]
				text-xs text-std-700
				align-baseline
				bg-accent/48
				border border-border-light
			'
			data-session-token={attrs.tokenType}
		>
			<Icon className='size-3 shrink-0' />
			<span className='truncate font-medium'>{display_label}</span>
		</NodeViewWrapper>
	)
}

const tokenizer = {
	name: 'sessionToken',
	level: 'inline' as const,
	start: (src: string) => {
		const mention_index = src.indexOf('[')
		const reference_index = src.indexOf('REFERENCE: [')
		const indexes = [mention_index, reference_index].filter(index => index >= 0)

		return indexes.length ? Math.min(...indexes) : -1
	},
	tokenize: (src: string) => {
		const mention_match = src.match(mention_token_pattern)

		if (mention_match) {
			return {
				type: 'sessionToken',
				raw: mention_match[0],
				...parseMentionMatch(mention_match)
			}
		}

		const reference_match = src.match(reference_token_pattern)

		if (reference_match) {
			return {
				type: 'sessionToken',
				raw: reference_match[0],
				...parseReferenceMatch(reference_match)
			}
		}

		return undefined
	}
}

export default Node.create({
	name: 'sessionToken',
	group: 'inline',
	inline: true,
	atom: true,
	selectable: false,
	addAttributes() {
		return {
			tokenType: { default: 'tool' },
			label: { default: '' },
			refStart: { default: null },
			refEnd: { default: null }
		}
	},
	addCommands() {
		return {
			insertSessionToken:
				attrs =>
				({ commands }) =>
					commands.insertContent({
						type: this.name,
						attrs
					})
		}
	},
	addInputRules() {
		return [
			new InputRule({
				find: mention_input_pattern,
				handler: ({ range, match, commands }) => {
					const token = match[1]
					const prefix = match[0].slice(0, match[0].lastIndexOf(token))

					commands.insertContentAt(range, [
						...(prefix ? [{ type: 'text', text: prefix }] : []),
						{
							type: this.name,
							attrs: parseInputMentionMatch(match)
						}
					])
				}
			}),
			new InputRule({
				find: reference_input_pattern,
				handler: ({ range, match, commands }) => {
					const token = match[1]
					const prefix = match[0].slice(0, match[0].lastIndexOf(token))

					commands.insertContentAt(range, [
						...(prefix ? [{ type: 'text', text: prefix }] : []),
						{
							type: this.name,
							attrs: parseInputReferenceMatch(match)
						}
					])
				}
			})
		]
	},
	addPasteRules() {
		return [
			nodePasteRule({
				find: mention_paste_pattern,
				type: this.type,
				getAttributes: match => parseMentionMatch(match)
			}),
			nodePasteRule({
				find: reference_paste_pattern,
				type: this.type,
				getAttributes: match => parseReferenceMatch(match)
			})
		]
	},
	addNodeView() {
		return ReactNodeViewRenderer(SessionTokenView)
	},
	parseMarkdown(token, helpers) {
		return helpers.createNode('sessionToken', {
			tokenType: token.tokenType,
			label: token.label,
			refStart: token.refStart ?? null,
			refEnd: token.refEnd ?? null
		})
	},
	renderMarkdown(node) {
		return getTokenMarkdown(node.attrs as SessionTokenAttrs)
	},
	markdownTokenizer: {
		...markdown_spec.markdownTokenizer,
		...tokenizer
	},
	parseHTML() {
		return [{ tag: 'span[data-session-token]' }]
	},
	renderHTML({ node, HTMLAttributes }) {
		const attrs = node.attrs as SessionTokenAttrs

		return [
			'span',
			mergeAttributes(HTMLAttributes, {
				'data-session-token': attrs.tokenType,
				'data-token-label': attrs.tokenType === 'reference' ? getReferenceLabel(attrs) : attrs.label,
				contenteditable: 'false'
			})
		]
	},
	renderText({ node }) {
		return getTokenMarkdown(node.attrs as SessionTokenAttrs)
	}
})

declare module '@tiptap/core' {
	interface Commands<ReturnType> {
		sessionToken: {
			insertSessionToken: (attrs: SessionTokenAttrs) => ReturnType
		}
	}
}

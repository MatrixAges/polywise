import CodeBlock from '@tiptap/extension-code-block'
import { BundledLanguage, BundledTheme } from 'shiki'
import { local } from 'stk/storage'

import { ShikiPlugin } from './shiki-plugin'

export interface CodeBlockShikiOptions {
	defaultLanguage: BundledLanguage | null | undefined
	defaultTheme: BundledTheme
}

export const CodeBlockShiki = CodeBlock.extend<CodeBlockShikiOptions>({
	addOptions() {
		return {
			...this.parent?.(),
			defaultLanguage: null,
			defaultTheme: `github-${local.theme_value}` as 'github-light'
		}
	},
	addProseMirrorPlugins() {
		return [
			...(this.parent?.() || []),
			ShikiPlugin({
				name: this.name,
				defaultLanguage: this.options.defaultLanguage
			})
		]
	}
})

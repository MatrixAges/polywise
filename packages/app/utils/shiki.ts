import { codeToHtml } from 'shiki'

import type { Theme } from '@/types'
import type { BundledLanguage } from 'shiki/bundle/web'

interface Args {
	code: string
	lang: BundledLanguage
	theme: Theme
}

export const highlight = async (args: Args) => {
	const { code, lang, theme } = args

	const code_text = await codeToHtml(code, {
		lang,
		themes: { light: 'github-light', dark: 'github-dark' },
		defaultColor: theme,
		structure: 'inline'
	})

	const lines = code.split('\n')
	const length = lines.length

	let line_numbers = ''

	for (let i = 0; i < length; i++) {
		if (i !== length - 1) {
			line_numbers += `<span class="line_number">${i + 1}</span>`
		}
	}

	const html = `<div class="line_numbers_wrap">${line_numbers}</div><pre class="pre">${code_text}</pre>`

	return html
}

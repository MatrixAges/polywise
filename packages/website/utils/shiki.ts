import { createHighlighter } from 'shiki/bundle/web'

import type { BundledLanguage } from 'shiki/bundle/web'

export const highlight = async (code: string, lang: BundledLanguage) => {
	const highlighter = await createHighlighter({
		langs: ['typescript', 'javascript'],
		themes: ['github-dark']
	})
	const code_text = highlighter.codeToHtml(code, { lang, theme: 'github-dark', structure: 'inline' })

	const lines = code.split('\n')
	const length = lines.length

	let line_numbers = ''

	for (let i = 0; i < length; i++) {
		if (i !== length - 1) {
			line_numbers += `<span class="line_number">${i + 1}</span>`
		}
	}

	return `<div class="line_numbers_wrap">${line_numbers}</div><pre class="pre_code_wrap">${code_text}</pre>`
}

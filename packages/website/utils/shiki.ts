import { bundledLanguagesInfo, createHighlighter } from 'shiki/bundle/web'

import type { BundledLanguage } from 'shiki/bundle/web'

const light_theme = 'github-light'
const dark_theme = 'github-dark'
const fallback_language = 'text'
const initial_languages: Array<BundledLanguage> = ['typescript', 'javascript']

const known_languages = new Set<string>()

for (const item of bundledLanguagesInfo) {
	known_languages.add(item.id)

	for (const alias of item.aliases || []) {
		known_languages.add(alias)
	}
}

let highlighter_promise: ReturnType<typeof createHighlighter> | null = null

const getHighlighter = () => {
	if (!highlighter_promise) {
		highlighter_promise = createHighlighter({
			langs: initial_languages,
			themes: [light_theme, dark_theme]
		})
	}

	return highlighter_promise
}

const resolveLanguage = (lang: string) => (known_languages.has(lang) ? lang : fallback_language)

export const highlight = async (code: string, lang: BundledLanguage | string) => {
	const highlighter = await getHighlighter()
	const normalized_language = resolveLanguage(lang)

	if (!highlighter.getLoadedLanguages().includes(normalized_language)) {
		await highlighter.loadLanguage(normalized_language as BundledLanguage)
	}

	const code_text = highlighter.codeToHtml(code, {
		lang: normalized_language,
		themes: {
			light: light_theme,
			dark: dark_theme
		}
	})

	return `<div class="pre_code_wrap">${code_text}</div>`
}

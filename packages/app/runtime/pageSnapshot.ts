import { page_map_by_id, resolvePageByPathname } from '@core/cli/page/registry'

import type { PageRuntimeSnapshot, PageVisibleSection } from '@core/cli/types'

const max_text_length = 320
const max_sections = 10
const max_actions = 16

const normalizeText = (value: string) => value.replace(/\s+/g, ' ').trim()

const isVisible = (element: Element | null): element is HTMLElement => {
	if (!(element instanceof HTMLElement)) {
		return false
	}

	const style = window.getComputedStyle(element)

	return (
		style.display !== 'none' &&
		style.visibility !== 'hidden' &&
		element.getBoundingClientRect().width > 0 &&
		element.getBoundingClientRect().height > 0
	)
}

const getTextExcerpt = (element: Element) => normalizeText(element.textContent || '').slice(0, max_text_length)

const getSectionTitle = (element: Element, index: number) => {
	const explicit =
		element.getAttribute('data-page-section') ||
		element.getAttribute('aria-label') ||
		element.querySelector('h1, h2, h3, h4')?.textContent ||
		''

	return normalizeText(explicit) || `section-${index + 1}`
}

const detectSectionKind = (element: Element): PageVisibleSection['kind'] => {
	if (element.matches('form') || element.querySelector('input, textarea, select')) {
		return 'form'
	}

	if (element.querySelector('[contenteditable="true"]')) {
		return 'editor'
	}

	if (element.querySelector('[data-message-id], [data-role="assistant"], [data-role="user"]')) {
		return 'chat'
	}

	if (element.querySelector('ul, ol')) {
		return 'list'
	}

	if (element.querySelector('h1, h2, h3, h4')) {
		return 'heading'
	}

	return 'detail'
}

const collectSections = () => {
	const explicit_sections = Array.from(document.querySelectorAll('[data-page-section]')).filter(isVisible)
	const fallback_sections = Array.from(
		document.querySelectorAll(
			'main section, main article, form, [role="main"] > div, [data-page-root="route"] > *, [data-page-root="panel"] > *'
		)
	).filter(isVisible)
	const sections = (explicit_sections.length ? explicit_sections : fallback_sections).slice(0, max_sections)

	return sections.map((element, index) => ({
		id: element.getAttribute('data-page-section') || `section-${index + 1}`,
		title: getSectionTitle(element, index),
		kind: detectSectionKind(element),
		summary: getTextExcerpt(element),
		text_excerpt: getTextExcerpt(element)
	}))
}

const collectActions = () => {
	const action_elements = Array.from(document.querySelectorAll('button, a, input, textarea, select'))
		.filter(isVisible)
		.slice(0, max_actions)

	return action_elements.map((element, index) => {
		const label =
			normalizeText(
				element.getAttribute('aria-label') ||
					element.getAttribute('title') ||
					('value' in element ? String((element as HTMLInputElement).value || '') : '') ||
					element.textContent ||
					''
			) || `action-${index + 1}`

		return {
			id: element.getAttribute('data-page-action') || `action-${index + 1}`,
			label,
			kind: element.matches('a')
				? ('navigate' as const)
				: element.matches('input, textarea, select')
					? ('input' as const)
					: ('click' as const)
		}
	})
}

const getActivePanelTab = () => {
	const target = document.querySelector('[data-page-tabs=\"panel\"] [data-active=\"true\"]')

	return target?.getAttribute('data-tab-key') || null
}

export const collectPageSnapshot = (args: {
	pathname: string
	params: Record<string, string>
	search: Record<string, string>
}): PageRuntimeSnapshot => {
	const page = resolvePageByPathname(args.pathname)
	const heading = Array.from(document.querySelectorAll('h1, h2')).find(isVisible)
	const page_title = normalizeText(heading?.textContent || '') || page?.title || 'unknown'
	const visible_sections = collectSections()
	const panel_tab = getActivePanelTab()
	const page_id = page?.id || null
	const panel_page = panel_tab
		? Array.from(page_map_by_id.values()).find(item => item.panel_tab === panel_tab)?.id
		: null
	const page_summary =
		visible_sections[0]?.summary ||
		page?.summary ||
		(panel_page ? page_map_by_id.get(panel_page)?.summary || '' : '') ||
		''

	return {
		route: {
			pathname: args.pathname,
			params: args.params,
			search: args.search
		},
		panel: {
			active_tab: panel_tab
		},
		page_id,
		page_title,
		page_summary,
		visible_sections,
		actions: collectActions(),
		updated_at: Date.now()
	}
}

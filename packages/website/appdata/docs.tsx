import { useMemo } from 'react'
import { useMemoizedFn } from '@website/hooks/ahooks'
import useLocale from '@website/hooks/useLocale'

import type { DocsMenuGroup, DocsMenuItem, DocsMenuLink, DocsMenuSection } from '@website/types'

interface DocCard {
	link: string
	label: string
	desc: string
}

const popular_keys = ['intro', 'config', 'providers', 'usage/cli', 'guides/project_workspace', 'system/fst']
const basics_keys = [
	'usage/web',
	'usage/desktop',
	'guides/capture_contents',
	'guides/group_chat',
	'system/memory_callback',
	'troubleshooting'
]

const classNameOf = (key: string) => key.replaceAll('/', '-')

const flattenMenuItems = (menu: DocsMenuSection[]) => {
	return menu.flatMap(section => (section.type === 'group' ? section.children : [section]))
}

export { flattenMenuItems }

const buildDocsData = (l: (en: string, zh?: string, ja?: string) => string) => {
	const top_links = [
		{
			type: 'link',
			key: 'intro',
			className: classNameOf('intro'),
			label: l('Intro'),
			desc: 'Overview, terminology, and documentation structure.'
		},
		{
			type: 'link',
			key: 'config',
			className: classNameOf('config'),
			label: l('Config'),
			desc: 'Configuration model, setup patterns, and environments.'
		},
		{
			type: 'link',
			key: 'providers',
			className: classNameOf('providers'),
			label: l('Providers'),
			desc: 'Compare model providers, capabilities, and tradeoffs.'
		},
		{
			type: 'link',
			key: 'troubleshooting',
			className: classNameOf('troubleshooting'),
			label: l('Troubleshooting'),
			desc: 'Debug common failures and recovery paths.'
		}
	] satisfies DocsMenuLink[]

	const groups = [
		{
			type: 'group',
			key: 'usage',
			label: l('Usage'),
			children: [
				{
					key: 'usage/cli',
					className: classNameOf('usage/cli'),
					label: l('CLI'),
					desc: 'Run Polywise in the terminal and automate workflows.'
				},
				{
					key: 'usage/web',
					className: classNameOf('usage/web'),
					label: l('Web'),
					desc: 'Use the browser app for lightweight access and tasks.'
				},
				{
					key: 'usage/desktop',
					className: classNameOf('usage/desktop'),
					label: l('Desktop'),
					desc: 'Use the desktop app for local-first workflows.'
				}
			]
		},
		{
			type: 'group',
			key: 'guides',
			label: l('Guides'),
			children: [
				{
					key: 'guides/capture_contents',
					className: classNameOf('guides/capture_contents'),
					label: l('Capture Contents'),
					desc: 'Capture pages, files, and live context into workspaces.'
				},
				{
					key: 'guides/agent_private_contents',
					className: classNameOf('guides/agent_private_contents'),
					label: l('Agent Private Contents'),
					desc: 'Keep agent-only context separate from shared project content.'
				},
				{
					key: 'guides/group_chat',
					className: classNameOf('guides/group_chat'),
					label: l('Group Chat'),
					desc: 'Coordinate shared conversations in one project context.'
				},
				{
					key: 'guides/project_workspace',
					className: classNameOf('guides/project_workspace'),
					label: l('Project Workspace'),
					desc: 'Organize code, content, and runtime state together.'
				},
				{
					key: 'guides/im_integration',
					className: classNameOf('guides/im_integration'),
					label: l('IM Integration'),
					desc: 'Connect messaging surfaces and route them into Polywise.'
				},
				{
					key: 'guides/content_service_providers',
					className: classNameOf('guides/content_service_providers'),
					label: l('Content Service Providers'),
					desc: 'Integrate external content backends and ingestion sources.'
				}
			]
		},
		{
			type: 'group',
			key: 'system',
			label: l('System'),
			children: [
				{
					key: 'system/fst',
					className: classNameOf('system/fst'),
					label: l('FST'),
					desc: 'Understand how the FST layer structures state.'
				},
				{
					key: 'system/memory_callback',
					className: classNameOf('system/memory_callback'),
					label: l('Memory Callback'),
					desc: 'Retrieve and persist memory at the right moments.'
				},
				{
					key: 'system/post_think',
					className: classNameOf('system/post_think'),
					label: l('Post Think'),
					desc: 'Review what runs after reasoning and shapes results.'
				},
				{
					key: 'system/rewire_mechanisms',
					className: classNameOf('system/rewire_mechanisms'),
					label: l('Rewire Mechanisms'),
					desc: 'Learn how context, tools, and control flow are rewired.'
				}
			]
		}
	] satisfies DocsMenuGroup[]

	const menu = [...top_links, ...groups] as DocsMenuSection[]
	const docs_by_key = Object.fromEntries(
		flattenMenuItems(menu).map(item => [item.key, { link: item.key, label: item.label, desc: item.desc ?? '' }])
	) as Record<string, DocCard>

	return {
		menu,
		popular: popular_keys.map(key => docs_by_key[key]),
		basics: basics_keys.map(key => docs_by_key[key])
	}
}

export const useDocsHome = () => {
	const { locale } = useLocale()

	const l = useMemoizedFn((en: string, zh?: string, ja?: string) => {
		if (locale === 'zh') return zh || en
		if (locale === 'ja') return ja || en
		return en
	})

	return useMemo(() => buildDocsData(l), [locale, l])
}

export const useMenu = () => {
	const { menu } = useDocsHome()

	return menu
}

import { useMemo } from 'react'
import { useMemoizedFn } from '@website/hooks/ahooks'
import useLocale from '@website/hooks/useLocale'

import type { DocsMenuGroup, DocsMenuItem, DocsMenuLink, DocsMenuSection } from '@website/types'

interface DocCard {
	link: string
	label: string
	desc: string
}

const popular_keys = ['intro', 'config', 'providers', 'cli', 'project_workspace', 'fst']
const basics_keys = ['web', 'desktop', 'capture_contents', 'group_chat', 'memory_callback', 'troubleshooting']

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
			desc: 'Start here for the product overview, terminology, and documentation scope.'
		},
		{
			type: 'link',
			key: 'config',
			className: classNameOf('config'),
			label: l('Config'),
			desc: 'Learn the core configuration model, setup patterns, and environment expectations.'
		},
		{
			type: 'link',
			key: 'providers',
			className: classNameOf('providers'),
			label: l('Providers'),
			desc: 'Review provider roles, capability boundaries, and integration tradeoffs.'
		},
		{
			type: 'link',
			key: 'troubleshooting',
			className: classNameOf('troubleshooting'),
			label: l('Troubleshooting'),
			desc: 'Use debugging checklists and recovery steps for common failures.'
		}
	] satisfies DocsMenuLink[]

	const groups = [
		{
			type: 'group',
			key: 'usage',
			label: l('Usage'),
			children: [
				{
					key: 'cli',
					className: classNameOf('cli'),
					label: l('CLI'),
					desc: 'Run Polywise from the terminal and automate common workflows.'
				},
				{
					key: 'web',
					className: classNameOf('web'),
					label: l('Web'),
					desc: 'Use the web app for browser-based access and lightweight operations.'
				},
				{
					key: 'desktop',
					className: classNameOf('desktop'),
					label: l('Desktop'),
					desc: 'Use the desktop app for local-first workflows and richer integrations.'
				}
			]
		},
		{
			type: 'group',
			key: 'guides',
			label: l('Guides'),
			children: [
				{
					key: 'capture_contents',
					className: classNameOf('capture_contents'),
					label: l('Capture Contents'),
					desc: 'Capture material from pages, files, and live context into the workspace.'
				},
				{
					key: 'agent_private_contents',
					className: classNameOf('agent_private_contents'),
					label: l('Agent Private Contents'),
					desc: 'Keep agent-only context isolated from user-visible project materials.'
				},
				{
					key: 'group_chat',
					className: classNameOf('group_chat'),
					label: l('Group Chat'),
					desc: 'Coordinate shared conversations around the same project context.'
				},
				{
					key: 'project_workspace',
					className: classNameOf('project_workspace'),
					label: l('Project Workspace'),
					desc: 'Organize repositories, content, and runtime state inside a workspace.'
				},
				{
					key: 'im_integration',
					className: classNameOf('im_integration'),
					label: l('IM Integration'),
					desc: 'Connect messaging surfaces and route conversations into Polywise.'
				},
				{
					key: 'content_service_providers',
					className: classNameOf('content_service_providers'),
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
					key: 'fst',
					className: classNameOf('fst'),
					label: l('FST'),
					desc: 'Understand how the FST layer structures state and transitions.'
				},
				{
					key: 'memory_callback',
					className: classNameOf('memory_callback'),
					label: l('Memory Callback'),
					desc: 'See how callbacks retrieve and persist memory at the right moments.'
				},
				{
					key: 'post_think',
					className: classNameOf('post_think'),
					label: l('Post Think'),
					desc: 'Review what runs after reasoning and how post-think hooks shape results.'
				},
				{
					key: 'rewire_mechanisms',
					className: classNameOf('rewire_mechanisms'),
					label: l('Rewire Mechanisms'),
					desc: 'Learn how the system rewires context, tools, and control flow safely.'
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

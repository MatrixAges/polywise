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
			label: l('Intro', '介绍', 'イントロ'),
			desc: l(
				'Overview, terminology, and documentation structure.',
				'整体概览、术语说明与文档结构。',
				'全体像、用語、ドキュメント構成の説明。'
			)
		},
		{
			type: 'link',
			key: 'config',
			className: classNameOf('config'),
			label: l('Config', '配置', '設定'),
			desc: l(
				'Configuration model, setup patterns, and environments.',
				'配置模型、设置方式与运行环境。',
				'設定モデル、セットアップ方法、動作環境。'
			)
		},
		{
			type: 'link',
			key: 'providers',
			className: classNameOf('providers'),
			label: l('Providers', '提供方', 'プロバイダー'),
			desc: l(
				'Compare model providers, capabilities, and tradeoffs.',
				'比较模型提供方、能力与取舍。',
				'モデルプロバイダー、機能、トレードオフを比較する。'
			)
		},
		{
			type: 'link',
			key: 'troubleshooting',
			className: classNameOf('troubleshooting'),
			label: l('Troubleshooting', '故障排查', 'トラブルシューティング'),
			desc: l(
				'Debug common failures and recovery paths.',
				'排查常见故障与恢复路径。',
				'よくある障害と復旧手順を確認する。'
			)
		}
	] satisfies DocsMenuLink[]

	const groups = [
		{
			type: 'group',
			key: 'usage',
			label: l('Usage', '使用', '使い方'),
			children: [
				{
					key: 'usage/cli',
					className: classNameOf('usage/cli'),
					label: l('CLI', 'CLI', 'CLI'),
					desc: l(
						'Run Polywise in the terminal and automate workflows.',
						'在终端中运行 Polywise，并自动化工作流。',
						'ターミナルで Polywise を使い、ワークフローを自動化する。'
					)
				},
				{
					key: 'usage/web',
					className: classNameOf('usage/web'),
					label: l('Web', 'Web', 'Web'),
					desc: l(
						'Use the browser app for lightweight access and tasks.',
						'通过浏览器应用完成轻量访问与任务。',
						'ブラウザアプリで軽量なアクセスと作業を行う。'
					)
				},
				{
					key: 'usage/desktop',
					className: classNameOf('usage/desktop'),
					label: l('Desktop', '桌面端', 'デスクトップ'),
					desc: l(
						'Use the desktop app for full open-source workflows.',
						'通过桌面应用完成完整的开源工作流。',
						'デスクトップアプリでフル機能のオープンソースワークフローを使う。'
					)
				}
			]
		},
		{
			type: 'group',
			key: 'guides',
			label: l('Guides', '指南', 'ガイド'),
			children: [
				{
					key: 'guides/capture_contents',
					className: classNameOf('guides/capture_contents'),
					label: l('Capture Contents', '捕获内容', 'コンテンツを取り込む'),
					desc: l(
						'Capture pages, files, and live context into workspaces.',
						'将页面、文件和实时上下文捕获到工作区中。',
						'ページ、ファイル、ライブな文脈をワークスペースに取り込む。'
					)
				},
				{
					key: 'guides/agent_private_contents',
					className: classNameOf('guides/agent_private_contents'),
					label: l('Agent Private Contents', 'Agent 私有内容', 'Agent 専用コンテンツ'),
					desc: l(
						'Keep agent-only context separate from shared project content.',
						'将仅供 agent 使用的上下文与共享项目内容分开。',
						'agent 専用の文脈を共有プロジェクト内容から分離して保つ。'
					)
				},
				{
					key: 'guides/group_chat',
					className: classNameOf('guides/group_chat'),
					label: l('Group Chat', '群组对话', 'グループチャット'),
					desc: l(
						'Coordinate shared conversations in one project context.',
						'在同一项目上下文中协同共享对话。',
						'同じプロジェクト文脈で共有会話を調整する。'
					)
				},
				{
					key: 'guides/project_workspace',
					className: classNameOf('guides/project_workspace'),
					label: l('Project Workspace', '项目工作区', 'プロジェクトワークスペース'),
					desc: l(
						'Organize code, content, and runtime state together.',
						'将代码、内容和运行状态组织在一起。',
						'コード、コンテンツ、実行状態を一緒に整理する。'
					)
				},
				{
					key: 'guides/im_integration',
					className: classNameOf('guides/im_integration'),
					label: l('IM Integration', 'IM 集成', 'IM 統合'),
					desc: l(
						'Connect messaging surfaces and route them into Polywise.',
						'连接消息渠道并将其导入 Polywise。',
						'メッセージ面を接続し、Polywise に流し込む。'
					)
				},
				{
					key: 'guides/content_service_providers',
					className: classNameOf('guides/content_service_providers'),
					label: l('Content Service Providers', '内容服务提供方', 'コンテンツサービスプロバイダー'),
					desc: l(
						'Integrate external content backends and ingestion sources.',
						'接入外部内容后端与采集来源。',
						'外部コンテンツ基盤と取り込み元を統合する。'
					)
				}
			]
		},
		{
			type: 'group',
			key: 'system',
			label: l('System', '系统', 'システム'),
			children: [
				{
					key: 'system/fst',
					className: classNameOf('system/fst'),
					label: l('FST', 'FST', 'FST'),
					desc: l(
						'Understand how the FST layer structures state.',
						'理解 FST 层如何组织状态。',
						'FST レイヤーがどのように状態を構成するかを理解する。'
					)
				},
				{
					key: 'system/memory_callback',
					className: classNameOf('system/memory_callback'),
					label: l('Memory Callback', '记忆回调', 'メモリコールバック'),
					desc: l(
						'Retrieve and persist memory at the right moments.',
						'在合适的时机检索并持久化记忆。',
						'適切なタイミングでメモリを取得・永続化する。'
					)
				},
				{
					key: 'system/post_think',
					className: classNameOf('system/post_think'),
					label: l('Post Think', '后思考', 'ポストシンク'),
					desc: l(
						'Review what runs after reasoning and shapes results.',
						'了解推理之后运行、并塑造结果的过程。',
						'推論後に動き、結果を形作る処理を確認する。'
					)
				},
				{
					key: 'system/rewire_mechanisms',
					className: classNameOf('system/rewire_mechanisms'),
					label: l('Rewire Mechanisms', '重塑机制', 'リワイヤ機構'),
					desc: l(
						'Learn how context, tools, and control flow are rewired.',
						'了解上下文、工具和控制流如何被重新组织。',
						'文脈、ツール、制御フローがどう組み替えられるかを学ぶ。'
					)
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

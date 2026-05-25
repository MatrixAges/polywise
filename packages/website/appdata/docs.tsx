import { useMemo } from 'react'
import {
	AlignCenterVerticalIcon,
	AlignTopSimpleIcon,
	BandaidsIcon,
	BoxArrowDownIcon,
	CalendarCheckIcon,
	CheckCircleIcon,
	CompassIcon,
	GearSixIcon,
	GraphIcon,
	KanbanIcon,
	MarkdownLogoIcon,
	NotebookIcon,
	RepeatIcon,
	SlidersIcon,
	StudentIcon,
	TableIcon,
	TimerIcon,
	TreeStructureIcon,
	WallIcon
} from '@phosphor-icons/react'
import { useMemoizedFn } from '@website/hooks/ahooks'
import useLocale from '@website/hooks/useLocale'

import type { DocsMenuGroup } from '@website/types'

export const popular = [
	{
		link: 'getting_started/start_guide',
		icon: <StudentIcon weight='fill'></StudentIcon>
	},
	{
		link: 'todo/linked_todo',
		icon: <GraphIcon weight='fill'></GraphIcon>
	},
	{
		link: 'todo/cycle_todo',
		icon: <RepeatIcon weight='fill'></RepeatIcon>
	},
	{
		link: 'note/blocks',
		icon: <WallIcon weight='fill'></WallIcon>
	},
	{
		link: 'schedule/schedule',
		icon: <CalendarCheckIcon weight='fill'></CalendarCheckIcon>
	},
	{
		link: 'global_settings/settings',
		icon: <SlidersIcon weight='fill'></SlidersIcon>
	}
]

export const basics = [
	{
		link: 'todo/auto_archive',
		icon: <BoxArrowDownIcon weight='fill'></BoxArrowDownIcon>
	},
	{
		link: 'todo/settings',
		icon: <GearSixIcon weight='fill'></GearSixIcon>
	},
	{
		link: 'note/note',
		icon: <MarkdownLogoIcon weight='fill'></MarkdownLogoIcon>
	},
	{
		link: 'note/table',
		icon: <TableIcon weight='fill'></TableIcon>
	},
	{
		link: 'pomo/flow_mode',
		icon: <AlignTopSimpleIcon weight='fill'></AlignTopSimpleIcon>
	},
	{
		link: 'schedule/timeline_view',
		icon: <AlignCenterVerticalIcon weight='fill'></AlignCenterVerticalIcon>
	}
]

export const useMenu = () => {
	const { locale } = useLocale()

	const l = useMemoizedFn((en: string, zh?: string, ja?: string) => {
		if (locale === 'zh') return zh || en
		if (locale === 'ja') return ja || en
		return en
	})

	return useMemo(
		() =>
			[
				{
					key: 'getting_started',
					label: l('Getting started', '开始使用', 'はじめに'),
					children: [
						{
							key: 'getting_started/start_guide',
							className: 'getting_started-start_guide',
							label: l('Start guide', '使用指南', 'スタートガイド'),
							icon: <StudentIcon weight='fill'></StudentIcon>
						},
						{
							key: 'getting_started/concepts',
							className: 'getting_started-concepts',
							label: l('Concepts', '概念', 'コンセプト'),
							icon: <BandaidsIcon weight='fill'></BandaidsIcon>
						}
					]
				},
				{
					key: 'todo',
					label: l('Todo', '待办', 'Todo'),
					children: [
						{
							key: 'todo/todo',
							className: 'todo-todo',
							label: l('Todo', '待办', 'Todo'),
							icon: <CheckCircleIcon weight='fill'></CheckCircleIcon>
						},
						{
							key: 'todo/linked_todo',
							className: 'todo-linked_todo',
							label: l('Linked Todo', '互斥任务', '連携 Todo'),
							icon: <GraphIcon weight='fill'></GraphIcon>
						},
						{
							key: 'todo/cycle_todo',
							className: 'todo-cycle_todo',
							label: l('Cycle Todo', '循环任务', '繰り返し Todo'),
							icon: <RepeatIcon weight='fill'></RepeatIcon>
						},
						{
							key: 'todo/to_schedule',
							className: 'todo-to_schedule',
							label: l('To Schedule', '推送至日程', 'スケジュールへ送る'),
							icon: <CalendarCheckIcon weight='fill'></CalendarCheckIcon>
						},
						{
							key: 'todo/auto_archive',
							className: 'todo-auto_archive',
							label: l('Auto Archive', '自动归档', '自動アーカイブ'),
							icon: <BoxArrowDownIcon weight='fill'></BoxArrowDownIcon>
						},
						{
							key: 'todo/kanban_view',
							className: 'todo-kanban_view',
							label: l('Kanban view', '看板视图', 'カンバン表示'),
							icon: <KanbanIcon weight='fill'></KanbanIcon>
						},
						{
							key: 'todo/table_view',
							className: 'todo-table_view',
							label: l('Table view', '表格视图', 'テーブル表示'),
							icon: <TableIcon weight='fill'></TableIcon>
						},
						{
							key: 'todo/mindmap_view',
							className: 'todo-mindmap_view',
							label: l('Mindmap view', '思维导图视图', 'マインドマップ表示'),
							icon: <TreeStructureIcon weight='fill'></TreeStructureIcon>
						},
						{
							key: 'todo/settings',
							className: 'todo-settings',
							label: l('Settings', '设置项', '設定'),
							icon: <GearSixIcon weight='fill'></GearSixIcon>
						}
					]
				},
				{
					key: 'note',
					label: l('Note', '笔记', 'ノート'),
					children: [
						{
							key: 'note/note',
							className: 'note-note',
							label: l('Note', '笔记', 'ノート'),
							icon: <MarkdownLogoIcon weight='fill'></MarkdownLogoIcon>
						},
						{
							key: 'note/blocks',
							className: 'note-blocks',
							label: l('Blocks', '内容块', 'ブロック'),
							icon: <WallIcon weight='fill'></WallIcon>
						},
						{
							key: 'note/table',
							className: 'note-table',
							label: l('Table', '表格', 'テーブル'),
							icon: <TableIcon weight='fill'></TableIcon>
						},
						{
							key: 'note/settings',
							className: 'note-settings',
							label: l('Settings', '设置项', '設定'),
							icon: <GearSixIcon weight='fill'></GearSixIcon>
						}
					]
				},
				{
					key: 'pomo',
					label: l('Pomo', '番茄钟', 'ポモドーロ'),
					children: [
						{
							key: 'pomo/pomo',
							className: 'pomo-pomo',
							label: l('Pomo', '番茄钟', 'ポモドーロ'),
							icon: <TimerIcon weight='fill'></TimerIcon>
						},
						{
							key: 'pomo/flow_mode',
							className: 'pomo-flow_mode',
							label: l('Flow Mode', '心流模式', 'フローモード'),
							icon: <AlignTopSimpleIcon weight='fill'></AlignTopSimpleIcon>
						}
					]
				},
				{
					key: 'schedule',
					label: l('Schedule', '日程', 'スケジュール'),
					children: [
						{
							key: 'schedule/schedule',
							className: 'schedule-schedule',
							label: l('Schedule', '日程', 'スケジュール'),
							icon: <CalendarCheckIcon weight='fill'></CalendarCheckIcon>
						},
						{
							key: 'schedule/month_view',
							className: 'schedule-month_view',
							label: l('Month View', '月视图', '月表示'),
							icon: <AlignCenterVerticalIcon weight='fill'></AlignCenterVerticalIcon>
						},
						{
							key: 'schedule/timeline_view',
							className: 'schedule-timeline_view',
							label: l('Timeline View', '时间线视图', 'タイムライン表示'),
							icon: <AlignCenterVerticalIcon weight='fill'></AlignCenterVerticalIcon>
						},
						{
							key: 'schedule/fixed_view',
							className: 'schedule-fixed_view',
							label: l('Fixed View', '固定视图', '固定表示'),
							icon: <CompassIcon weight='fill'></CompassIcon>
						},
						{
							key: 'schedule/settings',
							className: 'schedule-settings',
							label: l('Settings', '设置项', '設定'),
							icon: <GearSixIcon weight='fill'></GearSixIcon>
						}
					]
				},
				{
					key: 'global_settings',
					label: l('Global Settings', '全局设置', '全体設定'),
					children: [
						{
							key: 'global_settings/settings',
							className: 'global_settings-settings',
							label: l('Settings', '设置项', '設定'),
							icon: <SlidersIcon weight='fill'></SlidersIcon>
						},
						{
							key: 'gtd',
							className: 'gtd',
							label: l('Way of GTD', 'GTD 之道', 'GTD の考え方'),
							icon: <NotebookIcon weight='fill'></NotebookIcon>
						}
					]
				}
			] as DocsMenuGroup[],
		[locale, l]
	)
}

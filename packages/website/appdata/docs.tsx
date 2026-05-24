import {
	AlignCenterVertical,
	AlignTopSimple,
	Bandaids,
	BoxArrowDown,
	CalendarCheck,
	CheckCircle,
	Compass,
	GearSix,
	Graph,
	Kanban,
	MarkdownLogo,
	Notebook,
	Repeat,
	Sliders,
	Student,
	Table,
	Timer,
	TreeStructure,
	Wall
} from '@phosphor-icons/react'
import { useMemoizedFn } from '@website/hooks/ahooks'
import useLocale from '@website/hooks/useLocale'

import type { DocsMenuGroup } from '@website/types'

export const popular = [
	{
		link: 'getting_started/start_guide',
		icon: <Student weight='fill'></Student>
	},
	{
		link: 'todo/linked_todo',
		icon: <Graph weight='fill'></Graph>
	},
	{
		link: 'todo/cycle_todo',
		icon: <Repeat weight='fill'></Repeat>
	},
	{
		link: 'note/blocks',
		icon: <Wall weight='fill'></Wall>
	},
	{
		link: 'schedule/schedule',
		icon: <CalendarCheck weight='fill'></CalendarCheck>
	},
	{
		link: 'global_settings/settings',
		icon: <Sliders weight='fill'></Sliders>
	}
]

export const basics = [
	{
		link: 'todo/auto_archive',
		icon: <BoxArrowDown weight='fill'></BoxArrowDown>
	},
	{
		link: 'todo/settings',
		icon: <GearSix weight='fill'></GearSix>
	},
	{
		link: 'note/note',
		icon: <MarkdownLogo weight='fill'></MarkdownLogo>
	},
	{
		link: 'note/table',
		icon: <Table weight='fill'></Table>
	},
	{
		link: 'pomo/flow_mode',
		icon: <AlignTopSimple weight='fill'></AlignTopSimple>
	},
	{
		link: 'schedule/timeline_view',
		icon: <AlignCenterVertical weight='fill'></AlignCenterVertical>
	}
]

export const useMenu = () => {
	const { locale } = useLocale()

	const l = useMemoizedFn((en: string, cn?: string) => (locale === 'zh' ? cn || en : en))

	return [
		{
			key: 'getting_started',
			label: l('Getting started', '开始使用'),
			children: [
				{
					key: 'getting_started/start_guide',
					className: 'getting_started-start_guide',
					label: l('Start guide', '使用指南'),
					icon: <Student weight='fill'></Student>
				},
				{
					key: 'getting_started/concepts',
					className: 'getting_started-concepts',
					label: l('Concepts', '概念'),
					icon: <Bandaids weight='fill'></Bandaids>
				}
			]
		},
		{
			key: 'todo',
			label: l('Todo', '待办'),
			children: [
				{
					key: 'todo/todo',
					className: 'todo-todo',
					label: l('Todo', '待办'),
					icon: <CheckCircle weight='fill'></CheckCircle>
				},
				{
					key: 'todo/linked_todo',
					className: 'todo-linked_todo',
					label: l('Linked Todo', '互斥任务'),
					icon: <Graph weight='fill'></Graph>
				},
				{
					key: 'todo/cycle_todo',
					className: 'todo-cycle_todo',
					label: l('Cycle Todo', '循环任务'),
					icon: <Repeat weight='fill'></Repeat>
				},
				{
					key: 'todo/to_schedule',
					className: 'todo-to_schedule',
					label: l('To Schedule', '推送至日程'),
					icon: <CalendarCheck weight='fill'></CalendarCheck>
				},
				{
					key: 'todo/auto_archive',
					className: 'todo-auto_archive',
					label: l('Auto Archive', '自动归档'),
					icon: <BoxArrowDown weight='fill'></BoxArrowDown>
				},
				{
					key: 'todo/kanban_view',
					className: 'todo-kanban_view',
					label: l('Kanban view', '看板视图'),
					icon: <Kanban weight='fill'></Kanban>
				},
				{
					key: 'todo/table_view',
					className: 'todo-table_view',
					label: l('Table view', '表格视图'),
					icon: <Table weight='fill'></Table>
				},
				{
					key: 'todo/mindmap_view',
					className: 'todo-mindmap_view',
					label: l('Mindmap view', '思维导图视图'),
					icon: <TreeStructure weight='fill'></TreeStructure>
				},
				{
					key: 'todo/settings',
					className: 'todo-settings',
					label: l('Settings', '设置项'),
					icon: <GearSix weight='fill'></GearSix>
				}
			]
		},
		{
			key: 'note',
			label: l('Note', '笔记'),
			children: [
				{
					key: 'note/note',
					className: 'note-note',
					label: l('Note', '笔记'),
					icon: <MarkdownLogo weight='fill'></MarkdownLogo>
				},
				{
					key: 'note/blocks',
					className: 'note-blocks',
					label: l('Blocks', '内容块'),
					icon: <Wall weight='fill'></Wall>
				},
				{
					key: 'note/table',
					className: 'note-table',
					label: l('Table', '表格'),
					icon: <Table weight='fill'></Table>
				},
				{
					key: 'note/settings',
					className: 'note-settings',
					label: l('Settings', '设置项'),
					icon: <GearSix weight='fill'></GearSix>
				}
			]
		},
		{
			key: 'pomo',
			label: l('Pomo', '番茄钟'),
			children: [
				{
					key: 'pomo/pomo',
					className: 'pomo-pomo',
					label: l('Pomo', '番茄钟'),
					icon: <Timer weight='fill'></Timer>
				},
				{
					key: 'pomo/flow_mode',
					className: 'pomo-flow_mode',
					label: l('Flow Mode', '心流模式'),
					icon: <AlignTopSimple weight='fill'></AlignTopSimple>
				}
			]
		},
		{
			key: 'schedule',
			label: l('Schedule', '日程'),
			children: [
				{
					key: 'schedule/schedule',
					className: 'schedule-schedule',
					label: l('Schedule', '日程'),
					icon: <CalendarCheck weight='fill'></CalendarCheck>
				},
				{
					key: 'schedule/month_view',
					className: 'schedule-month_view',
					label: l('Month View', '月视图'),
					icon: <AlignCenterVertical weight='fill'></AlignCenterVertical>
				},
				{
					key: 'schedule/timeline_view',
					className: 'schedule-timeline_view',
					label: l('Timeline View', '时间线视图'),
					icon: <AlignCenterVertical weight='fill'></AlignCenterVertical>
				},
				{
					key: 'schedule/fixed_view',
					className: 'schedule-fixed_view',
					label: l('Fixed View', '固定视图'),
					icon: <Compass weight='fill'></Compass>
				},
				{
					key: 'schedule/settings',
					className: 'schedule-settings',
					label: l('Settings', '设置项'),
					icon: <GearSix weight='fill'></GearSix>
				}
			]
		},
		{
			key: 'global_settings',
			label: l('Global Settings', '全局设置'),
			children: [
				{
					key: 'global_settings/settings',
					className: 'global_settings-settings',
					label: l('Settings', '设置项'),
					icon: <Sliders weight='fill'></Sliders>
				},
				{
					key: 'gtd',
					className: 'gtd',
					label: l('Way of GTD', 'GTD 之道'),
					icon: <Notebook weight='fill'></Notebook>
				}
			]
		}
	] as DocsMenuGroup[]
}

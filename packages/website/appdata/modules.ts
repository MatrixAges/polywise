import { CalendarCheckIcon, CheckCircleIcon, MarkdownLogoIcon, SquaresFourIcon, TimerIcon } from '@phosphor-icons/react'

export default [
	{
		name: 'todo',
		Icon: CheckCircleIcon,
		extra_path: '/doc'
	},
	{
		name: 'note',
		Icon: MarkdownLogoIcon
	},
	{
		name: 'pomo',
		Icon: TimerIcon
	},
	{
		name: 'schedule',
		Icon: CalendarCheckIcon
	},
	{
		name: 'features',
		Icon: SquaresFourIcon
	}
]

export const modules = ['todo', 'note', 'pomo', 'schedule']

export const images_map = {
	todo: ['0_todo', '1_todo_detail', '2_todo_kanban', '3_todo_table', '4_todo_mindmap', '5_todo_setting'],
	note: ['0_note', '1_note_picker', '2_note_setting', '3_note_options'],
	pomo: ['0_pomo', '1_pomo_edit'],
	schedule: [
		'0_schedule',
		'1_schedule_week',
		'2_schedule_month',
		'3_schedule_timeline',
		'4_schedule_fixed',
		'5_schedule_filter',
		'6_schedule_setting'
	],
	features: ['0_multi_tab', '1_multi_color', '2_search', '3_dark_mode', '4_auto_theme', '5_screenlock']
}

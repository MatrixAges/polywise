import { CalendarCheckIcon, ChatDotsIcon, FilesIcon, MagnifyingGlassIcon, SquaresFourIcon } from '@phosphor-icons/react'

const module_cards = [
	{
		name: 'todo',
		Icon: FilesIcon,
		extra_path: '/doc'
	},
	{
		name: 'note',
		Icon: MagnifyingGlassIcon
	},
	{
		name: 'pomo',
		Icon: ChatDotsIcon
	},
	{
		name: 'schedule',
		Icon: CalendarCheckIcon
	},
	{
		name: 'features',
		Icon: SquaresFourIcon
	}
] as const

export default module_cards

export const modules = ['todo', 'note', 'pomo', 'schedule'] as const
export const banner_images = ['linkcase', 'agent_session', 'agent_detail', 'home']
export const features_images = ['post', 'group', 'project', 'im']

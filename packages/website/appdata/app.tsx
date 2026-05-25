import { CalendarCheckIcon, ChatDotsIcon, FilesIcon, MagnifyingGlassIcon } from '@phosphor-icons/react'

import type { ReactNode } from 'react'

export const modules_map = {
	0: {
		Icon: <FilesIcon></FilesIcon>,
		key: 'todo',
		origin: '/blog/know_your_self?title=From%20Notes%20to%20Memory'
	},
	1: {
		Icon: <MagnifyingGlassIcon></MagnifyingGlassIcon>,
		key: 'note',
		origin: '/blog/finding_your_self?title=Designing%20Local-First%20Workflows'
	},
	2: {
		Icon: <ChatDotsIcon></ChatDotsIcon>,
		key: 'pomo',
		origin: '/blog/beyond_your_self?title=Agents%20Need%20Better%20Context'
	},
	3: {
		Icon: <CalendarCheckIcon></CalendarCheckIcon>,
		key: 'schedule',
		origin: '/blog/facing_change_with_plan?title=Planning%20for%20an%20Evolving%20Knowledge%20Base'
	}
} as any

export const modules_arr = Object.values(modules_map) as Array<{ Icon: ReactNode; key: string }>

export const mac_arch_map = {
	arm64: 'Apple Silicon',
	x64: 'Intel'
}

export const os_map = {
	darwin: 'macOS',
	win32: 'Windows'
}

export const exec_map = {
	darwin: 'dmg',
	win32: 'exe'
}

export const version_file_link = 'https://github.com/MatrixAges/polywise/releases/latest'

export const getReleaseLink = (_os: OS, _arch: Arch, _version: string) => {
	return github_release_link
}

export const github_release_link = 'https://github.com/MatrixAges/polywise/releases'

export const mails = {
	support: 'mailto:hello@polywise.io',
	enterprise: 'mailto:team@polywise.io',
	member: 'mailto:community@polywise.io'
}

export const medias = {
	x: 'https://x.com/xiewendao',
	github: 'https://github.com/MatrixAges/polywise',
	discord: 'https://discord.gg/6MDTdVzR3Y'
}

export type OS = 'darwin' | 'win32'
export type Arch = 'arm64' | 'x64'

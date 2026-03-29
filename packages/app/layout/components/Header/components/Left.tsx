import { PanelLeft } from 'lucide-react'

import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue
} from '@/__shadcn__/components/ui/select'
import Logo from '@/public/bare.svg?react'

import type { IPropsLeft } from '../types'

const Index = (props: IPropsLeft) => {
	const { workspaces, current_workspace, toggleSidebar } = props

	return (
		<div
			className='
				absolute
				left-3.5
				flex
				items-center
				h-full
			'
		>
			<div
				className='
					flex
					items-center justify-center
					transition-all
					hover:fill-std-black
					fill-std-300
				'
				style={{ width: 16, height: 16 }}
			>
				<Logo width='100%' height='100%'></Logo>
			</div>
			<div
				className='
					w-px h-[14px]
					ml-4 mr-3
					bg-under/16
				'
			></div>
			<button className='icon_button mr-1' onClick={toggleSidebar}>
				<PanelLeft></PanelLeft>
			</button>
			<Select
				items={workspaces.map(item => ({ label: item.name, value: item.name }))}
				value={current_workspace ?? null}
			>
				<SelectTrigger className='workspace_selector' no_active_style>
					<SelectValue />
				</SelectTrigger>
				<SelectContent className='w-[180px]' align='start'>
					<SelectGroup>
						<SelectLabel>Workspaces</SelectLabel>
						{workspaces.map(item => (
							<SelectItem value={item.name} key={item.name}>
								{item.name}
							</SelectItem>
						))}
					</SelectGroup>
				</SelectContent>
			</Select>
		</div>
	)
}

export default $app.memo(Index)

import { PanelLeft, PanelRight, SlidersHorizontal } from 'lucide-react'
import { NavLink } from 'react-router'

import { workspaces } from '@/__metadata__'
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue
} from '@/__shadcn__/components/ui/select'
import { nav_items } from '@/appdata'
import Logo from '@/public/bare.svg?react'

const Index = () => {
	return (
		<div
			className='
				relative
				flex
				items-center justify-center
				w-full h-[43px]
				border-std-100/80 border-b
			'
		>
			<div
				className='
					absolute
					left-3
					flex
					items-center
					h-full
				'
			>
				<div
					className='
						flex
						items-center justify-center
						w-4.5 h-4.5
						transition-all
						hover:fill-std-black
						fill-std-300
					'
				>
					<Logo width='100%' height='100%'></Logo>
				</div>
				<div
					className='
						w-px h-[14px]
						ml-4 mr-3
						bg-std-100
					'
				></div>
				<button className='icon_button mr-3'>
					<PanelLeft></PanelLeft>
				</button>
				<Select
					items={workspaces.map(item => ({ label: item.name, value: item.endpoint }))}
					defaultValue={workspaces.at(-1)!.endpoint}
				>
					<SelectTrigger className='bg-transparent! p-0'>
						<SelectValue />
					</SelectTrigger>
					<SelectContent className='w-[180px] p-1' align='start'>
						<SelectGroup>
							<SelectLabel>Workspaces</SelectLabel>
							{workspaces.map(item => (
								<SelectItem value={item.endpoint} key={item.id}>
									{item.name}
								</SelectItem>
							))}
						</SelectGroup>
					</SelectContent>
				</Select>
			</div>
			<div className='flex items-center'>
				<div
					className='
						flex
						items-center
						h-9
						gap-1.5
						text-xs
					'
				>
					{nav_items.map(({ key, Icon, title }) => (
						<NavLink to={`/${key}`} key={key}>
							{({ isActive }) => (
								<div
									className={$cx(
										`
										flex
										items-center justify-center
										h-7
										gap-1
										rounded-full
										hover:bg-std-100
										clickable
									`,
										isActive
											? 'text-std-black bg-std-100 px-2'
											: 'text-std-400/80 w-7'
									)}
								>
									<Icon size={14} />
									{isActive && <span className='capitalize'>{key || title}</span>}
								</div>
							)}
						</NavLink>
					))}
				</div>
			</div>
			<div
				className='
					absolute
					right-2
					flex
					items-center
					gap-2
				'
			>
				<button className='icon_button'>
					<SlidersHorizontal></SlidersHorizontal>
				</button>
				<button className='icon_button'>
					<PanelRight></PanelRight>
				</button>
			</div>
		</div>
	)
}

export default $app.memo(Index)

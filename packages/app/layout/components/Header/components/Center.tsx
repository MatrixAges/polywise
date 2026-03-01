import { NavLink } from 'react-router'

import { nav_items } from '@/appdata'

const Index = () => {
	return (
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
	)
}

export default $app.memo(Index)

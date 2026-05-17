import { observer } from 'mobx-react-lite'

import { ContextMenu, ContextMenuTrigger } from '@/__shadcn__/components/ui/context-menu'

import { useModel } from '../context'
import MenuContextActions from './MenuContextActions'
import MenuList from './MenuList'
import MenuSelectionBar from './MenuSelectionBar'
import MenuToolbar from './MenuToolbar'

const Index = () => {
	const x = useModel()

	return (
		<ContextMenu>
			<ContextMenuTrigger className='flex h-full'>
				<div
					className='
						flex flex-col shrink-0
						w-[240px] h-full
						bg-std-50/60
						dark:bg-std-100/60 dark:border-r dark:border-border-light/60
					'
					onContextMenuCapture={x.onMenuContextCapture}
				>
					<MenuToolbar></MenuToolbar>
					<MenuSelectionBar></MenuSelectionBar>
					<MenuList></MenuList>
				</div>
			</ContextMenuTrigger>
			<MenuContextActions></MenuContextActions>
		</ContextMenu>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()

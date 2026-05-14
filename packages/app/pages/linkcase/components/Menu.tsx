import { observer } from 'mobx-react-lite'

import { ContextMenu, ContextMenuTrigger } from '@/__shadcn__/components/ui/context-menu'

import { useModel } from '../context'
import MenuContextActions from './MenuContextActions'
import MenuFooter from './MenuFooter'
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
						w-[320px] h-full
						bg-std-50/50
						border-r border-border-light
					'
					onContextMenuCapture={x.onMenuContextCapture}
				>
					<MenuToolbar></MenuToolbar>
					<MenuSelectionBar></MenuSelectionBar>
					<MenuList></MenuList>
					<MenuFooter></MenuFooter>
				</div>
			</ContextMenuTrigger>
			<MenuContextActions></MenuContextActions>
		</ContextMenu>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()

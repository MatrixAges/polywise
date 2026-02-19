import { observer } from 'mobx-react-lite'

import { useGlobal } from '@/context'

import { Sidebar } from './components'

import type { IPropsSidebar } from './types'

const Index = () => {
	const global = useGlobal()
	const settings = global.settings

	const props_side_bar: IPropsSidebar = {
		toggleSettings: settings.toggleSettings
	}

	return (
		<div className='flex h-full w-full overflow-y-scroll'>
			<Sidebar {...props_side_bar}></Sidebar>
		</div>
	)
}

export default new $app.handle(Index).by(observer).by($app.memo).get()

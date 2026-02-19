import { observer } from 'mobx-react-lite'

import { useGlobal } from '@/context'
import Home from '@/pages/home'
import Memory from '@/pages/memory'
import { memo } from '@/utils'

import type { IPropsPage } from '../../types'

const Index = observer((props: IPropsPage) => {
	const { settings } = useGlobal()

	const renderPage = () => {
		switch (settings.current_page) {
			case 'memory':
				return <Memory />
			case 'home':
			default:
				return <Home />
		}
	}

	return <div className='bg-std-100 flex flex-1'>{renderPage()}</div>
})

export default memo(Index)

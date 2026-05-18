import { observer } from 'mobx-react-lite'

import { useModel } from '../context'
import EditorPane from './EditorPane'
import NotFound from './NotFound'
import Sidebar from './Sidebar'

const Index = () => {
	const x = useModel()

	if (x.not_found) {
		return <NotFound></NotFound>
	}

	return (
		<div className='flex h-full overflow-hidden'>
			<Sidebar></Sidebar>
			<div
				className='
					overflow-hidden
					flex flex-1 flex-col
					min-w-0
				'
			>
				<EditorPane></EditorPane>
			</div>
		</div>
	)
}

export default observer(Index)

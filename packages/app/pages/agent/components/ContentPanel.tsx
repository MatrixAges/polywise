import { observer } from 'mobx-react-lite'

import ContentEditor from './ContentEditor'
import ContentMenu from './ContentMenu'
import ContentRelatedDialog from './ContentRelatedDialog'

const Index = () => {
	return (
		<div className='flex h-full overflow-hidden'>
			<ContentMenu></ContentMenu>
			<div className='flex min-w-0 flex-1 flex-col'>
				<ContentEditor></ContentEditor>
			</div>
			<ContentRelatedDialog></ContentRelatedDialog>
		</div>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()

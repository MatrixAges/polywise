import { observer } from 'mobx-react-lite'

import ContentBody from './ContentBody'
import ContentHeader from './ContentHeader'

const Index = () => {
	return (
		<div className='flex min-w-0 flex-1 flex-col'>
			<ContentHeader></ContentHeader>
			<ContentBody></ContentBody>
		</div>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()

import { File } from '@pierre/diffs/react'
import { observer } from 'mobx-react-lite'

import { useGlobal } from '@/context'

import { useModel } from '../context'

const Index = () => {
	const {} = useModel()

	const global = useGlobal()

	return (
		<div className='flex'>
			<File file={{ name: '', contents: '' }} options={{ theme: global.theme.theme_value }}></File>
		</div>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()

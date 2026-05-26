import { useMemoizedFn } from 'ahooks'
import { observer } from 'mobx-react-lite'

import { useGlobal } from '@/context'

import Panel from './ai-sdk-panel'

const Index = () => {
	const global = useGlobal()

	const s = global.setting
	const onChange = useMemoizedFn(v => s.setConfig('providers', v))

	return (
		<div className='flex h-full w-full'>
			<Panel config={$copy(s.providers)} onChange={onChange} />
		</div>
	)
}

export const Component = new $app.Handle(Index).by(observer).by($app.memo).get()

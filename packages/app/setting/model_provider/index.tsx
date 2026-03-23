import { useMemoizedFn } from 'ahooks'
import { observer } from 'mobx-react-lite'

import { useGlobal } from '@/context'
import { sleep } from '@/utils'

import Panel from './ai-sdk-panel'

import type { IPropsPanel } from './ai-sdk-panel/types'

const Index = () => {
	const global = useGlobal()

	const s = global.setting

	const props_panel: IPropsPanel = {
		config: $copy(s.providers),
		onChange: useMemoizedFn(v => s.setConfig('providers', v)),
		onTest: useMemoizedFn(async () => {
			await sleep(500)

			return true
		})
	}

	return (
		<div className='flex h-full w-full'>
			<Panel {...props_panel} />
		</div>
	)
}

export const Component = new $app.Handle(Index).by(observer).by($app.memo).get()

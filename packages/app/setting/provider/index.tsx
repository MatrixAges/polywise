import { useMemoizedFn } from 'ahooks'

import { sleep } from '@/utils'

import Panel from './ai-sdk-panel'
import { preset_providers } from './ai-sdk-panel/providers'

import type { IPropsPanel } from './ai-sdk-panel/types'

const Index = () => {
	const props_panel: IPropsPanel = {
		config: { providers: preset_providers },
		onChange: useMemoizedFn(v => {
			console.log(v)
		}),
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

export default $app.memo(Index)

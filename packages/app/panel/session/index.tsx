import { useState } from 'react'
import { container } from 'tsyringe'

import { useAliveEffect } from '@/hooks'

import Model from './model'

const Index = () => {
	const [x] = useState(() => container.resolve(Model))

	const { setRef } = useAliveEffect({
		init: () => x.init('global_panel_session'),
		deinit: () => x.deinit()
	})

	return <div className='flex' ref={setRef}></div>
}

export default $app.memo(Index)

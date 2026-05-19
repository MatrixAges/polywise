import { useEffect, useRef } from 'react'
import { observer } from 'mobx-react-lite'
import { useParams } from 'react-router'
import { container } from 'tsyringe'

import { useGlobal } from '@/context'

import { EditorPanel, NotFound, SessionPanel, Sidebar } from './components'
import { Context } from './context'
import Model from './model'

const Index = () => {
	const params = useParams()
	const global = useGlobal()
	const route_post_id = params.id ?? ''
	const ref_model = useRef<Model | null>(null)

	if (!ref_model.current) {
		ref_model.current = container.resolve(Model)
	}

	const x = ref_model.current

	useEffect(() => {
		x.init()

		return () => x.deinit()
	}, [x])

	useEffect(() => {
		x.setRoutePostId(route_post_id)
	}, [route_post_id, x])

	return (
		<Context value={x}>
			{x.not_found ? (
				<NotFound></NotFound>
			) : (
				<div className='flex h-full overflow-hidden'>
					{!global.setting.sidebar_collapsed && <Sidebar></Sidebar>}
					<div
						className='
							overflow-hidden
							flex flex-1
							min-w-0
						'
					>
						<div className='flex min-w-0 flex-1 flex-col'>
							<EditorPanel></EditorPanel>
						</div>
						{x.session_panel_open && (
							<div
								className='
									overflow-hidden
									flex flex-col shrink-0
									w-[320px] h-full
									bg-std-50/60
									border-border-light border-l
									dark:bg-std-100/60
								'
							>
								<SessionPanel></SessionPanel>
							</div>
						)}
					</div>
				</div>
			)}
		</Context>
	)
}

export const Component = new $app.Handle(Index).by(observer).by($app.memo).get()

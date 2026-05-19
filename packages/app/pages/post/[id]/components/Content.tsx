import { observer } from 'mobx-react-lite'

import { useModel } from '../context'
import EditorPane from './EditorPane'
import NotFound from './NotFound'
import SessionPanel from './SessionPanel'
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
					flex flex-1
					min-w-0
				'
			>
				<div className='flex min-w-0 flex-1 flex-col'>
					<EditorPane></EditorPane>
				</div>
				{x.session_panel_open ? (
					<div
						className='
							overflow-hidden
							flex flex-col shrink-0
							w-[420px] h-full
							bg-background
							border-border-light border-l
						'
					>
						<SessionPanel></SessionPanel>
					</div>
				) : null}
			</div>
		</div>
	)
}

export default observer(Index)

import { Session } from '@/components'

const Index = () => {
	return <Session type='global' id='global_panel_session'></Session>
}

export default $app.memo(Index)

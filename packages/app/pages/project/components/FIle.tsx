import { observer } from 'mobx-react-lite'

const Index = () => {
	return <div className='flex'></div>
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()

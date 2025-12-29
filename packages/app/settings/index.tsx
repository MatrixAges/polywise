import { useMemoizedFn } from 'ahooks'
import { Form, Radio, Switch } from 'antd'
import { observer } from 'mobx-react-lite'

import { Modal } from '@/components'
import { useGlobal } from '@/context'

const { useForm, Item } = Form
const { Group } = Radio

const Index = () => {
	const global = useGlobal()
	const x = global.settings
	const form = useForm()

	const closeSettings = useMemoizedFn(() => (x.open = false))

	return (
		<Modal title='Settings' open={x.open} onClose={closeSettings}>
			<Form className='flex flex-col' layout='inline'>
				<Item className='flex justify-between' label='Theme' name='theme'>
					<Group options={['Dark', 'Light']}></Group>
				</Item>
				<Item label='Virancy' name='vibrancy'>
					<Switch size='small'></Switch>
				</Item>
				<Item label='Compact' name='compact'>
					<Switch size='small'></Switch>
				</Item>
			</Form>
		</Modal>
	)
}

export default new $app.handle(Index).by(observer).by($app.memo).get()

import { observer } from 'mobx-react-lite'

import { FileContent } from '@/components'

import { useModel } from '../context'

const Index = () => {
	const { project_files } = useModel()
	const file = project_files.select_file!

	return <FileContent file={file}></FileContent>
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()

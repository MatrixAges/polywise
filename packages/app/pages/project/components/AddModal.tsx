import { observer } from 'mobx-react-lite'

import { Button } from '@/__shadcn__/components/ui/button'
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle
} from '@/__shadcn__/components/ui/dialog'
import { FileTree } from '@/components'

import { useModel } from '../context'

const Index = () => {
	const { add_modal_open, add_modal_paths, onToggleAddModal, onSelectAddModalPath } = useModel()

	return (
		<Dialog open={add_modal_open}>
			<DialogContent className='w-[540px] max-w-none!'>
				<DialogHeader>
					<DialogTitle>New Project</DialogTitle>
					<DialogDescription>Create a new project with a directory</DialogDescription>
				</DialogHeader>
				<FileTree paths={add_modal_paths} onSelectPath={onSelectAddModalPath}></FileTree>
				<DialogFooter>
					<DialogClose
						render={
							<Button variant='outline' onClick={onToggleAddModal}>
								Cancel
							</Button>
						}
					/>
					<Button>Confirm</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()

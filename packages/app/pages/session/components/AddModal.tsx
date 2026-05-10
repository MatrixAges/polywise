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
import { Input } from '@/__shadcn__/components/ui/input'
import { FileTree } from '@/components'

import { useModel } from '../context'

const Index = () => {
	const { add_modal_open, modal_files, onToggleAddModal, createProject } = useModel()

	return (
		<Dialog open={add_modal_open} onOpenChange={onToggleAddModal}>
			<DialogContent className='w-[540px] max-w-none!'>
				<DialogHeader>
					<DialogTitle>New Project</DialogTitle>
					<DialogDescription>Create a new project with a directory</DialogDescription>
				</DialogHeader>
				<div className='flex flex-col gap-3'>
					<div className='flex gap-3'>
						<Input
							value={modal_files.input_path}
							onChange={event => modal_files.setInputPath(event.target.value)}
						></Input>
						<Button onClick={modal_files.fetchPath}>Fetch</Button>
					</div>
					<FileTree
						paths={$copy(modal_files.paths)}
						onSelectPath={modal_files.selectPath}
						key={modal_files.tree_version}
					></FileTree>
				</div>
				<DialogFooter>
					<DialogClose render={<Button variant='outline'>Cancel</Button>} />
					<Button onClick={createProject}>Confirm</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()

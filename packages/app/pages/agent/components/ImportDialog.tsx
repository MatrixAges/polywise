import { FileArchive, Loader2 } from 'lucide-react'
import { observer } from 'mobx-react-lite'

import { Button } from '@/__shadcn__/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/__shadcn__/components/ui/dialog'
import { Input } from '@/__shadcn__/components/ui/input'
import { FileTree } from '@/components'

import { useModel } from '../context'

const Index = () => {
	const {
		import_dialog_open,
		import_agent_file_path,
		import_agent_loading,
		import_dialog_files,
		setImportDialogOpen,
		setImportAgentFilePath,
		selectImportDialogPath,
		submitImportAgent
	} = useModel()
	const next_file_path = import_agent_file_path.trim()

	return (
		<Dialog
			open={import_dialog_open}
			onOpenChange={next_open => !import_agent_loading && setImportDialogOpen(next_open)}
		>
			<DialogContent
				className='
					overflow-hidden
					flex flex-col
					w-[560px] max-w-none!
					max-h-[calc(100vh-2rem)]
				'
			>
				<form
					className='
						overflow-hidden
						flex flex-col
						min-h-0
						gap-4
					'
					onSubmit={async event => {
						event.preventDefault()

						if (!next_file_path) {
							return
						}

						await submitImportAgent()
					}}
				>
					<DialogHeader>
						<DialogTitle>Import Agent</DialogTitle>
					</DialogHeader>
					<div
						className='
							overflow-hidden
							flex flex-col
							min-h-0
							gap-2
						'
					>
						<div className='flex gap-2'>
							<Input
								value={import_dialog_files.input_path}
								placeholder='Choose a directory path'
								onChange={event => import_dialog_files.setInputPath(event.target.value)}
							></Input>
							<Button
								type='button'
								variant='outline'
								disabled={
									!import_dialog_files.input_path.trim() || import_agent_loading
								}
								onClick={() => void import_dialog_files.fetchPath()}
							>
								Fetch
							</Button>
						</div>
						<FileTree
							className='border-border-gray! h-[min(48vh,360px)] rounded-xl border'
							paths={$copy(import_dialog_files.paths)}
							onSelectPath={path => void selectImportDialogPath(path)}
							key={import_dialog_files.tree_version}
						></FileTree>
						<div className='relative flex-1'>
							<FileArchive
								className='
									absolute
									top-1/2
									left-2.5
									size-4
									text-std-300
									-translate-y-1/2
								'
							></FileArchive>
							<Input
								className='pl-9'
								value={import_agent_file_path}
								placeholder='Select a .papk file from the tree'
								onChange={event => setImportAgentFilePath(event.target.value)}
							></Input>
						</div>
						<div className='text-std-300 text-xs'>
							Only `.papk` files exported from Agent Export are supported.
						</div>
					</div>
					<DialogFooter
						className='
							flex
							items-center justify-end
							gap-2
							sm:justify-end
						'
					>
						<Button
							variant='outline'
							type='button'
							onClick={() => setImportDialogOpen(false)}
							disabled={import_agent_loading}
						>
							Cancel
						</Button>
						<Button type='submit' disabled={!next_file_path || import_agent_loading}>
							{import_agent_loading ? (
								<Loader2 className='size-3.5 animate-spin'></Loader2>
							) : null}
							{import_agent_loading ? 'Importing...' : 'Import'}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()

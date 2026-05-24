import { useRef } from 'react'
import { FileArchive, FolderUp, Loader2 } from 'lucide-react'
import { observer } from 'mobx-react-lite'

import { Button } from '@/__shadcn__/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle
} from '@/__shadcn__/components/ui/dialog'
import { Input } from '@/__shadcn__/components/ui/input'

import { useModel } from '../context'

const Index = () => {
	const ref_file = useRef<HTMLInputElement>(null)
	const {
		import_dialog_open,
		import_agent_file_path,
		import_agent_loading,
		setImportDialogOpen,
		setImportAgentFilePath,
		submitImportAgent
	} = useModel()
	const next_file_path = import_agent_file_path.trim()

	return (
		<Dialog
			open={import_dialog_open}
			onOpenChange={next_open => !import_agent_loading && setImportDialogOpen(next_open)}
		>
			<DialogContent className='w-[560px] max-w-none!'>
				<form
					className='flex flex-col gap-4'
					onSubmit={async event => {
						event.preventDefault()

						if (!next_file_path) {
							return
						}

						await submitImportAgent()
					}}
				>
					<input
						ref={ref_file}
						className='hidden'
						type='file'
						accept='.papk'
						onChange={event => {
							const file = event.target.files?.[0]
							const local_file = file ? window.$shell?.getPathForFile(file) : null

							if (local_file?.path) {
								setImportAgentFilePath(local_file.path)
							}

							event.target.value = ''
						}}
					/>
					<DialogHeader>
						<DialogTitle>Import Agent</DialogTitle>
						<DialogDescription>
							Import a `.papk` snapshot to create a new agent. The pack is extracted into
							`app_dir/.temp`, imported, and the temporary files are removed after success.
						</DialogDescription>
					</DialogHeader>
					<div
						className='
							p-3
							rounded-lg
							text-sm text-std-400
							border border-border-light
						'
					>
						The import includes the agent record, private and related articles, documents,
						chunks, nodes, edges, links, and vector snapshots.
					</div>
					<div className='flex flex-col gap-2'>
						<div className='flex items-center gap-2'>
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
									placeholder='Select a .papk file'
									onChange={event => setImportAgentFilePath(event.target.value)}
								></Input>
							</div>
							<Button
								type='button'
								variant='outline'
								disabled={!window.$shell || import_agent_loading}
								onClick={() => ref_file.current?.click()}
							>
								<FolderUp className='size-3.5'></FolderUp>
								Browse
							</Button>
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

import { useMemoizedFn } from 'ahooks'
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
import { Textarea } from '@/__shadcn__/components/ui/textarea'

import { useModel } from '../context'

const Index = () => {
	const {
		selected_skill,
		edit_dialog_open,
		edit_name,
		edit_desc,
		setEditName,
		setEditDesc,
		closeEditDialog,
		saveSkillInfo,
		removeSkill
	} = useModel()

	const onOpenChange = useMemoizedFn((open: boolean) => {
		if (!open) {
			closeEditDialog()
		}
	})

	const onSave = useMemoizedFn(() => {
		void saveSkillInfo()
	})

	const onRemove = useMemoizedFn(() => {
		if (!selected_skill) {
			return
		}

		void removeSkill(selected_skill.id)
	})

	return (
		<Dialog open={edit_dialog_open} onOpenChange={onOpenChange}>
			<DialogContent className='max-w-lg'>
				<DialogHeader>
					<DialogTitle>Edit Skill</DialogTitle>
					<DialogDescription>Update skill name and description.</DialogDescription>
				</DialogHeader>
				<div className='flex flex-col gap-3'>
					<Input
						placeholder='Skill name'
						value={edit_name}
						onChange={event => setEditName(event.target.value)}
					></Input>
					<Textarea
						className='min-h-24'
						placeholder='Skill description'
						value={edit_desc}
						onChange={event => setEditDesc(event.target.value)}
					></Textarea>
				</div>
				<DialogFooter
					className='
						flex
						items-center justify-between
						gap-2
						sm:justify-between
					'
				>
					<Button variant='destructive' onClick={onRemove}>
						Remove
					</Button>
					<div className='flex items-center gap-2'>
						<Button variant='outline' onClick={closeEditDialog}>
							Cancel
						</Button>
						<Button onClick={onSave}>Save</Button>
					</div>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()

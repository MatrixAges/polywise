import { useMemoizedFn } from 'ahooks'
import { observer } from 'mobx-react-lite'

import { Button } from '@/__shadcn__/components/ui/button'
import { Input } from '@/__shadcn__/components/ui/input'
import { Textarea } from '@/__shadcn__/components/ui/textarea'
import { Dialog, DialogFooter } from '@/components'

import { useModel } from './context'

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
		<Dialog
			open={edit_dialog_open}
			title='Edit Skill'
			desc='Update skill name and description.'
			className='max-w-lg gap-4 sm:max-w-lg'
			setOpen={onOpenChange}
		>
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
					mt-4
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
		</Dialog>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()

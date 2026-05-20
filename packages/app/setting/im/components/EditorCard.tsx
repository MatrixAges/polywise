import { Trash2 } from 'lucide-react'
import { observer } from 'mobx-react-lite'

import { Badge } from '@/__shadcn__/components/ui/badge'
import { Button } from '@/__shadcn__/components/ui/button'
import { Field, FieldContent, FieldDescription, FieldGroup, FieldTitle } from '@/__shadcn__/components/ui/field'
import { Input } from '@/__shadcn__/components/ui/input'
import { Separator } from '@/__shadcn__/components/ui/separator'
import { Spinner } from '@/__shadcn__/components/ui/spinner'
import { Switch } from '@/__shadcn__/components/ui/switch'

import { useModel } from '../context'
import DiscordFields from './DiscordFields'
import WeChatFields from './WeChatFields'

import type { RefObject } from 'react'

type Props = {
	accountIdInputRef: RefObject<HTMLInputElement | null>
	editorCardRef: RefObject<HTMLDivElement | null>
}

const EditorCard = ({ accountIdInputRef, editorCardRef }: Props) => {
	const x = useModel()

	return (
		<div
			ref={editorCardRef}
			className='
				flex flex-col
				gap-5
				p-5
				rounded-3xl
				bg-background/70
				border
			'
		>
			<div
				className='
					flex flex-col
					gap-4
				'
			>
				<div
					className='
						flex flex-wrap
						items-start justify-between
						gap-3
					'
				>
					<div className='flex flex-col gap-2'>
						<Badge variant='outline' className='w-fit'>
							{x.editorMode === 'edit' ? 'Editing account' : 'Creating account'}
						</Badge>
						<div>
							<div className='text-base font-semibold'>
								{x.editorMode === 'edit' ? 'Edit IM Account' : 'Create IM Account'}
							</div>
							<div className='text-std-500 text-sm'>
								Select an account below to edit it, or switch the tabs in the header to
								start a new draft.
							</div>
						</div>
					</div>
					<div className='flex items-center gap-2'>
						{x.selectedAccount && (
							<Badge variant='outline'>
								Active routes: {x.getActiveRouteCount(x.selectedAccount)}
							</Badge>
						)}
						<Button
							type='button'
							variant='outline'
							onClick={() => void x.remove()}
							disabled={x.removing}
						>
							{x.removing ? <Spinner className='size-4' /> : <Trash2 className='size-4' />}
							<span>{x.editorMode === 'edit' ? 'Delete' : 'Clear'}</span>
						</Button>
						<Button type='button' onClick={() => void x.save()} disabled={x.saving}>
							{x.saving ? <Spinner className='size-4' /> : null}
							<span>{x.editorMode === 'edit' ? 'Save Changes' : 'Create Account'}</span>
						</Button>
					</div>
				</div>

				{x.editorMode === 'new' ? (
					<div
						className='
							px-4 py-3
							rounded-2xl
							text-sm text-std-500
							bg-muted/25
							border
						'
					>
						Choose a platform, enter a unique Account ID, then complete the platform-specific
						fields below.
					</div>
				) : null}
			</div>

			<FieldGroup className='gap-0'>
				<Field className='items-center! py-3' orientation='horizontal'>
					<FieldContent>
						<FieldTitle className='text-base'>Account ID</FieldTitle>
						<FieldDescription>Unique identifier used by inbound events</FieldDescription>
					</FieldContent>
					<Input
						ref={accountIdInputRef}
						className='max-w-[280px]'
						value={x.form.account_id}
						onChange={event => x.updateForm('account_id', event.target.value)}
						placeholder={x.accountIdPlaceholder}
					/>
				</Field>
				<Field className='items-center! py-3' orientation='horizontal'>
					<FieldContent>
						<FieldTitle className='text-base'>Label</FieldTitle>
						<FieldDescription>Optional display name for this account</FieldDescription>
					</FieldContent>
					<Input
						className='max-w-[280px]'
						value={x.form.label}
						onChange={event => x.updateForm('label', event.target.value)}
						placeholder={x.labelPlaceholder}
					/>
				</Field>
				<Field className='items-center! py-3' orientation='horizontal'>
					<FieldContent>
						<FieldTitle className='text-base'>Enabled</FieldTitle>
						<FieldDescription>
							Disabled accounts are not loaded into the runtime
						</FieldDescription>
					</FieldContent>
					<Switch
						checked={x.form.enabled}
						onCheckedChange={value => x.updateForm('enabled', value)}
					/>
				</Field>
			</FieldGroup>

			<Separator />

			{x.form.platform === 'discord' ? <DiscordFields></DiscordFields> : <WeChatFields></WeChatFields>}
		</div>
	)
}

export default observer(EditorCard)

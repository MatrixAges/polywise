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
import RuntimeOptions from './RuntimeOptions'
import SessionTargetOptions from './SessionTargetOptions'
import WeChatFields from './WeChatFields'

const Index = () => {
	const x = useModel()

	return (
		<div
			className='
				flex flex-col
				gap-5
				p-5
				rounded-3xl
				bg-background/70
				border
			'
		>
			{x.form.platform === 'discord' ? <DiscordFields></DiscordFields> : <WeChatFields></WeChatFields>}
			<Separator className='bg-border/80 h-px w-full' />
			<FieldGroup className='gap-0'>
				<Field className='items-center! py-3' orientation='horizontal'>
					<FieldContent>
						<FieldTitle className='text-base'>Account ID</FieldTitle>
						<FieldDescription>Unique identifier used by inbound events</FieldDescription>
					</FieldContent>
					<Input
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
			<Separator className='bg-border/80 h-px w-full' />
			<SessionTargetOptions />
			{x.isGlobalSessionTarget ? (
				<>
					<Separator className='bg-border/80 h-px w-full' />
					<RuntimeOptions />
				</>
			) : null}
			<div className='flex items-center justify-end gap-2'>
				{x.selectedAccount && (
					<Badge variant='outline'>Active routes: {x.getActiveRouteCount(x.selectedAccount)}</Badge>
				)}
				<Button type='button' variant='outline' onClick={() => void x.remove()} disabled={x.removing}>
					{x.removing ? <Spinner className='size-4' /> : <Trash2 className='size-4' />}
					<span>{x.editorMode === 'edit' ? 'Delete' : 'Clear'}</span>
				</Button>
				<Button type='button' onClick={() => void x.save()} disabled={x.saving}>
					{x.saving ? <Spinner className='size-4' /> : null}
					<span>{x.editorMode === 'edit' ? 'Save Changes' : 'Save Account'}</span>
				</Button>
			</div>
		</div>
	)
}

export default observer(Index)

import { Bot, Boxes, Layers3 } from 'lucide-react'
import { observer } from 'mobx-react-lite'

import { Button } from '@/__shadcn__/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/__shadcn__/components/ui/select'

import { useModel } from '../context'

const targetItems = [
	{ key: 'global', label: 'Global Session', Icon: Boxes },
	{ key: 'agent', label: 'Agent Session', Icon: Bot },
	{ key: 'group', label: 'Group Session', Icon: Layers3 }
] as const

const Index = () => {
	const x = useModel()

	return (
		<div className='flex flex-col gap-4'>
			<div className='flex flex-col gap-1'>
				<div className='text-sm font-medium'>Session Target</div>
				<div className='text-std-500 text-sm'>
					Choose what kind of session each IM route should bind to.
				</div>
			</div>

			<div className='flex flex-wrap gap-2'>
				{targetItems.map(item => {
					const Icon = item.Icon
					const active = x.form.session_target_type === item.key

					return (
						<Button
							type='button'
							size='sm'
							variant={active ? 'default' : 'outline'}
							className='h-auto px-3 py-2'
							key={item.key}
							onClick={() => x.setSessionTargetType(item.key)}
						>
							<Icon className='size-4' />
							<span>{item.label}</span>
						</Button>
					)
				})}
			</div>

			{x.form.session_target_type === 'global' ? (
				<div
					className='
						px-4 py-3
						rounded-2xl
						text-std-400 text-sm
						bg-muted/35
						border
					'
				>
					Use a plain IM session with configurable runtime options, similar to the global panel
					session behavior.
				</div>
			) : null}

			{x.form.session_target_type === 'agent' ? (
				<div className='bg-background/70 rounded-2xl border p-4'>
					<div className='mb-3 flex flex-col gap-1'>
						<div className='text-sm font-medium'>Owner Agent</div>
						<div className='text-std-500 text-sm'>
							Bind each IM route to an agent-owned session. The selected agent profile and
							tools become the session identity.
						</div>
					</div>
					<Select
						value={x.form.session_target_agent_id}
						onValueChange={value => x.updateForm('session_target_agent_id', value)}
					>
						<SelectTrigger>
							<SelectValue placeholder='Select an agent' />
						</SelectTrigger>
						<SelectContent>
							{x.agents.map(agent => (
								<SelectItem value={agent.id} key={agent.id}>
									{agent.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			) : null}

			{x.form.session_target_type === 'group' ? (
				<div className='bg-background/70 rounded-2xl border p-4'>
					<div className='mb-3 flex flex-col gap-1'>
						<div className='text-sm font-medium'>Group</div>
						<div className='text-std-500 text-sm'>
							Bind each IM route to a group session so the group runtime handles the
							conversation.
						</div>
					</div>
					<Select
						value={x.form.session_target_group_id}
						onValueChange={value => x.updateForm('session_target_group_id', value)}
					>
						<SelectTrigger>
							<SelectValue placeholder='Select a group' />
						</SelectTrigger>
						<SelectContent>
							{x.groups.map(group => (
								<SelectItem value={group.id} key={group.id}>
									{group.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			) : null}
		</div>
	)
}

export default observer(Index)

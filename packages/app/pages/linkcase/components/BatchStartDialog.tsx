import { observer } from 'mobx-react-lite'

import { Button } from '@/__shadcn__/components/ui/button'
import { Input } from '@/__shadcn__/components/ui/input'
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue
} from '@/__shadcn__/components/ui/select'
import { Switch } from '@/__shadcn__/components/ui/switch'
import { Dialog } from '@/components'

import { useModel } from '../context'

const count_options = Array.from({ length: 10 }, (_, index) => String(index + 1))

const Index = () => {
	const x = useModel()

	return (
		<Dialog
			open={x.start_dialog_open}
			title='Start Batch Run'
			desc='Configure schedule interval and choose whether each run should fetch, extract, or do both.'
			className='w-[460px]'
			setOpen={x.setStartDialogOpen}
		>
			<div className='flex flex-col gap-4'>
				<div className='flex flex-col gap-3'>
					<div className='text-sm font-medium'>Actions</div>
					<div
						className='
							p-3
							rounded-3xl
							bg-secondary/30
							border border-border-light
						'
					>
						<div className='flex items-center justify-between gap-3'>
							<div>
								<div className='text-sm font-medium'>Fetch</div>
								<div className='text-std-400 text-xs'>
									Pull fresh markdown into Linkcase.
								</div>
							</div>
							<Switch
								checked={x.batch_action_fetch_enabled}
								onCheckedChange={x.setBatchActionFetchEnabled}
							></Switch>
						</div>
					</div>
					<div
						className='
							p-3
							rounded-3xl
							bg-secondary/30
							border border-border-light
						'
					>
						<div className='flex items-center justify-between gap-3'>
							<div>
								<div className='text-sm font-medium'>Extract</div>
								<div className='text-std-400 text-xs'>
									Save content into vectors and generate triples.
								</div>
							</div>
							<Switch
								checked={x.batch_action_extract_enabled}
								onCheckedChange={x.setBatchActionExtractEnabled}
							></Switch>
						</div>
					</div>
				</div>
				<div className='flex flex-col gap-2'>
					<div className='text-sm font-medium'>Each run processes</div>
					<Select
						value={String(x.batch_count)}
						onValueChange={value => value && x.setBatchCount(value)}
					>
						<SelectTrigger
							className='
								px-3 py-2
								rounded-4xl
								text-sm
								bg-secondary/60
							'
						>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectGroup>
								<SelectLabel>Count</SelectLabel>
								{count_options.map(value => (
									<SelectItem value={value} key={value}>
										{value}
									</SelectItem>
								))}
							</SelectGroup>
						</SelectContent>
					</Select>
				</div>
				<div className='flex flex-col gap-2'>
					<div className='text-sm font-medium'>Run every</div>
					<div className='flex items-center gap-2'>
						<Input
							type='number'
							min={1}
							value={String(x.batch_interval_value)}
							onChange={event => x.setBatchIntervalValue(event.target.value)}
						></Input>
						<Select
							value={x.batch_interval_unit}
							onValueChange={value => value && x.setBatchIntervalUnit(value)}
						>
							<SelectTrigger
								className='
									w-[140px]
									px-3 py-2
									rounded-4xl
									text-sm
									bg-secondary/60
								'
							>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectGroup>
									<SelectLabel>Unit</SelectLabel>
									<SelectItem value='second'>seconds</SelectItem>
									<SelectItem value='minute'>minutes</SelectItem>
								</SelectGroup>
							</SelectContent>
						</Select>
					</div>
				</div>
				<div
					className='
						flex
						items-center justify-end
						gap-2
						pt-2
					'
				>
					<Button variant='ghost' size='sm' onClick={() => x.setStartDialogOpen(false)}>
						Cancel
					</Button>
					<Button
						size='sm'
						disabled={!x.batch_action_fetch_enabled && !x.batch_action_extract_enabled}
						onClick={x.startBatchSchedule}
					>
						Start
					</Button>
				</div>
			</div>
		</Dialog>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()

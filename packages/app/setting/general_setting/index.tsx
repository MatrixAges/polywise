import { useMemoizedFn } from 'ahooks'
import { observer } from 'mobx-react-lite'

import { Field, FieldContent, FieldDescription, FieldGroup, FieldTitle } from '@/__shadcn__/components/ui/field'
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue
} from '@/__shadcn__/components/ui/select'
import { locale_options, themes } from '@/appdata'
import { Controller } from '@/components'
import { useGlobal } from '@/context'
import { useForm } from '@/hooks'

const Index = () => {
	const global = useGlobal()
	const t = global.theme
	const l = global.locale

	const onChange = useMemoizedFn((_, changed) => {
		console.log(changed)
		if ('theme' in changed) t.setTheme(changed['theme'])
		if ('lang' in changed) l.setLang(changed['lang'])
	})

	const { control } = useForm<{ theme: string; lang: string }>(
		{ values: { theme: t.theme_source, lang: l.lang } },
		onChange
	)

	return (
		<div className='page_wrap flex w-full flex-col'>
			<FieldGroup className='gap-0'>
				<Field
					className='
						items-center!
						py-3
					'
					orientation='horizontal'
				>
					<FieldContent>
						<FieldTitle className='text-base'>Theme</FieldTitle>
						<FieldDescription>
							Customize the visual interface, including color modes and system
							synchronization
						</FieldDescription>
					</FieldContent>
					<Controller name='theme' control={control}>
						<Select items={themes.map(item => ({ label: item, value: item }))}>
							<SelectTrigger className='workspace_selector'>
								<SelectValue />
							</SelectTrigger>
							<SelectContent align='start'>
								<SelectGroup>
									<SelectLabel>Theme</SelectLabel>
									{themes.map(item => (
										<SelectItem value={item} key={item}>
											{item}
										</SelectItem>
									))}
								</SelectGroup>
							</SelectContent>
						</Select>
					</Controller>
				</Field>
				<Field className='items-center! py-3' orientation='horizontal'>
					<FieldContent>
						<FieldTitle className='text-base'>Language</FieldTitle>
						<FieldDescription>
							Select your preferred language for the application interface and notifications
						</FieldDescription>
					</FieldContent>
					<Controller name='lang' control={control}>
						<Select items={locale_options}>
							<SelectTrigger className='workspace_selector'>
								<SelectValue />
							</SelectTrigger>
							<SelectContent align='start'>
								<SelectGroup>
									<SelectLabel>Language</SelectLabel>
									{locale_options.map(item => (
										<SelectItem value={item.value} key={item.value}>
											{item.label}
										</SelectItem>
									))}
								</SelectGroup>
							</SelectContent>
						</Select>
					</Controller>
				</Field>
			</FieldGroup>
		</div>
	)
}

export const Component = new $app.Handle(Index).by(observer).by($app.memo).get()

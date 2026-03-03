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
import { Switch } from '@/__shadcn__/components/ui/switch'
import { locale_options, themes } from '@/appdata'
import { useGlobal } from '@/context'

const Index = () => {
	const global = useGlobal()
	const l = global.locale
	const t = global.theme

	const setLang = useMemoizedFn(v => l.setLang(v))
	const setTheme = useMemoizedFn(v => t.setTheme(v))

	return (
		<div className='flex w-full'>
			<FieldGroup className='page_wrap gap-0'>
				<Field className='border-dev items-center! border-b py-3' orientation='horizontal'>
					<FieldContent>
						<FieldTitle className='text-base'>Theme</FieldTitle>
						<FieldDescription>
							Customize the visual interface, including color modes and system
							synchronization
						</FieldDescription>
					</FieldContent>
					<Select
						items={themes.map(item => ({ label: item, value: item }))}
						value={t.theme_source}
						onValueChange={setTheme}
					>
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
				</Field>
				<Field className='border-dev items-center! border-b py-3' orientation='horizontal'>
					<FieldContent>
						<FieldTitle className='text-base'>Language</FieldTitle>
						<FieldDescription>
							Select your preferred language for the application interface and notifications
						</FieldDescription>
					</FieldContent>
					<Select items={locale_options} value={l.lang} onValueChange={setLang}>
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
				</Field>
				<Field className='border-dev items-center! border-b py-3' orientation='horizontal'>
					<FieldContent>
						<FieldTitle className='text-base'>Development Appearance</FieldTitle>
						<FieldDescription>
							Add dividers and backgrounds to the content area
						</FieldDescription>
					</FieldContent>
					<Switch id='switch-share' />
				</Field>
			</FieldGroup>
		</div>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()

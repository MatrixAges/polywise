import * as React from 'react'
import * as RechartsPrimitive from 'recharts'

import { useSize } from '@/hooks'

import { cn } from '@/__shadcn__/lib/utils/index'

export type ChartConfig = {
	[key: string]: {
		label?: React.ReactNode
		color?: string
		theme?: {
			light: string
			dark: string
		}
	}
}

type ChartContextValue = {
	config: ChartConfig
}

const ChartContext = React.createContext<ChartContextValue | null>(null)

const useChart = () => {
	const context = React.useContext(ChartContext)

	if (!context) {
		throw new Error('useChart must be used within a ChartContainer')
	}

	return context
}

const buildChartStyles = (id: string, config: ChartConfig) => {
	const entries = Object.entries(config).filter(([, item]) => item.color || item.theme)

	if (entries.length === 0) {
		return ''
	}

	const light_vars = entries
		.map(([key, item]) => `--color-${key}: ${item.theme?.light ?? item.color};`)
		.join('')
	const dark_vars = entries
		.map(([key, item]) => `--color-${key}: ${item.theme?.dark ?? item.color ?? item.theme?.light};`)
		.join('')

	return `
[data-chart="${id}"] { ${light_vars} }
.dark [data-chart="${id}"] { ${dark_vars} }
	`
}

const ChartStyle = (props: { id: string; config: ChartConfig }) => {
	const styles = buildChartStyles(props.id, props.config)

	if (!styles) {
		return null
	}

	return <style dangerouslySetInnerHTML={{ __html: styles }} />
}

const getConfigForItem = (config: ChartConfig, item: Record<string, unknown>) => {
	const keys = [item.dataKey, item.name].filter(value => typeof value === 'string') as Array<string>

	for (const key of keys) {
		if (config[key]) {
			return {
				key,
				item: config[key]
			}
		}
	}

	return null
}

export const ChartContainer = React.forwardRef<
	HTMLDivElement,
	React.ComponentProps<'div'> & {
		config: ChartConfig
		children: React.ReactElement
	}
>(({ id, className, children, config, ...props }, ref) => {
	const auto_id = React.useId().replace(/:/g, '')
	const chart_id = id ?? `chart-${auto_id}`
	const inner_ref = React.useRef<HTMLDivElement | null>(null)
	const size = useSize(() => inner_ref.current!, undefined) as
		| { width: number; height: number }
		| undefined
	const ready = Boolean(size && size.width > 0 && size.height > 0)

	const set_ref = React.useCallback(
		(node: HTMLDivElement | null) => {
			inner_ref.current = node

			if (typeof ref === 'function') {
				ref(node)
				return
			}

			if (ref) {
				ref.current = node
			}
		},
		[ref]
	)

	return (
		<ChartContext.Provider value={{ config }}>
			<div
				ref={set_ref}
				data-chart={chart_id}
				className={cn(
					'h-[220px] w-full min-w-0 min-h-[220px] text-xs [&_.recharts-cartesian-axis-tick_text]:fill-[rgba(var(--color_text_rgb),0.52)] [&_.recharts-cartesian-grid_line]:stroke-border/50 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-sector]:outline-none [&_.recharts-surface]:outline-none',
					className
				)}
				{...props}
			>
				<ChartStyle id={chart_id} config={config} />
				{ready ? (
					<RechartsPrimitive.ResponsiveContainer
						debounce={0}
						height='100%'
						initialDimension={{ width: size.width, height: size.height }}
						minWidth={0}
						width='100%'
					>
						{children}
					</RechartsPrimitive.ResponsiveContainer>
				) : null}
			</div>
		</ChartContext.Provider>
	)
})

ChartContainer.displayName = 'ChartContainer'

export const ChartTooltip = RechartsPrimitive.Tooltip

export const ChartTooltipContent = React.forwardRef<
	HTMLDivElement,
	React.ComponentProps<'div'> &
		RechartsPrimitive.TooltipContentProps<number, string> & {
			hideLabel?: boolean
			labelFormatter?: (
				value: string,
				payload: RechartsPrimitive.TooltipContentProps<number, string>['payload']
			) => React.ReactNode
		}
>(({ active, payload, className, label, hideLabel, labelFormatter }, ref) => {
	const { config } = useChart()

	if (!active || !payload?.length) {
		return null
	}

	return (
		<div
			ref={ref}
			className={cn(
				'grid min-w-[180px] gap-2 rounded-2xl border border-border/70 bg-background/96 px-3 py-2.5 text-xs shadow-xl backdrop-blur-sm',
				className
			)}
		>
			{!hideLabel ? (
				<div className='font-medium text-foreground'>
					{labelFormatter ? labelFormatter(String(label ?? ''), payload) : label}
				</div>
			) : null}
			<div className='grid gap-1.5'>
				{payload.map(item => {
					const found = getConfigForItem(config, item as Record<string, unknown>)
					const key = found?.key ?? String(item.dataKey ?? item.name ?? '')
					const value = typeof item.value === 'number' ? item.value.toLocaleString('en-US') : item.value

					return (
						<div className='flex items-center justify-between gap-4' key={key}>
							<div className='flex min-w-0 items-center gap-2'>
								<span
									className='size-2.5 shrink-0 rounded-[999px]'
									style={{ backgroundColor: item.color ?? `var(--color-${key})` }}
								/>
								<span className='truncate text-[rgba(var(--color_text_rgb),0.68)]'>
									{found?.item.label ?? item.name ?? key}
								</span>
							</div>
							<span className='font-medium text-foreground'>{value}</span>
						</div>
					)
				})}
			</div>
		</div>
	)
})

ChartTooltipContent.displayName = 'ChartTooltipContent'

export const ChartLegend = RechartsPrimitive.Legend

export const ChartLegendContent = React.forwardRef<
	HTMLDivElement,
	React.ComponentProps<'div'> & RechartsPrimitive.LegendProps
>(({ className, payload }, ref) => {
	const { config } = useChart()

	if (!payload?.length) {
		return null
	}

	return (
		<div ref={ref} className={cn('flex flex-wrap items-center gap-3 text-xs', className)}>
			{payload.map(item => {
				const found = getConfigForItem(config, item as Record<string, unknown>)
				const key = found?.key ?? String(item.dataKey ?? item.value ?? '')

				return (
					<div className='flex items-center gap-2 text-[rgba(var(--color_text_rgb),0.68)]' key={key}>
						<span
							className='size-2.5 rounded-[999px]'
							style={{ backgroundColor: item.color ?? `var(--color-${key})` }}
						/>
						<span>{found?.item.label ?? item.value ?? key}</span>
					</div>
				)
			})}
		</div>
	)
})

ChartLegendContent.displayName = 'ChartLegendContent'

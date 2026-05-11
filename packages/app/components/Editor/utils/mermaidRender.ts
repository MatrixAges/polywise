import to from 'await-to-js'
import mermaid from 'mermaid'
import { id } from 'stk/common'
import { local } from 'stk/storage'

export default async (value: string, container: HTMLElement, width?: number) => {
	mermaid.initialize({
		theme: local.theme === 'dark' ? 'dark' : 'default',
		fontSize: 13,
		fontFamily: 'var(--font_family)',
		gantt: {
			useMaxWidth: false,
			useWidth: width || 600,
			leftPadding: 60,
			rightPadding: 0
		},
		journey: {
			boxMargin: 0
		},
		xyChart: {
			titlePadding: 12,
			xAxis: { labelPadding: 12 },
			yAxis: { labelPadding: 3, titlePadding: 30 }
		}
	})

	const [err, res] = await to(mermaid.render(id(), value, container))

	if (err) return

	container.innerHTML = res.svg
}

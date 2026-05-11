import to from 'await-to-js'
import mermaid from 'mermaid'

export default async (value: string, container: HTMLElement, width?: number) => {
	const theme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'default'

	mermaid.initialize({
		theme,
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

	const uid =
		typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `mermaid-${Date.now()}`

	const [err, res] = await to(mermaid.render(uid, value, container))

	if (err) return

	container.innerHTML = res.svg
}

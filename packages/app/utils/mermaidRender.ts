import to from 'await-to-js'
import mermaid from 'mermaid'
import { id } from 'stk/common'

import type { Theme } from '@/types'

interface Args {
	content: string
	container: HTMLElement
	theme: Theme
	width?: number
}

export default async (args: Args) => {
	const { content, container, theme, width } = args

	mermaid.initialize({
		theme: theme === 'dark' ? 'dark' : 'default',
		look: 'handDrawn',
		fontFamily: 'var(--font_serif)',
		themeCSS: `
                  .nodes .label-container path:nth-of-type(1){
                        display:none;
                  }

                   .nodes .label-container path:nth-of-type(2){
                        stroke:var(--color_text);
                  }
            `,
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

	const [err, res] = await to(mermaid.render(id(), content, container))

	if (err) return

	container.innerHTML = res.svg
}

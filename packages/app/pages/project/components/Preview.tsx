import { File, Virtualizer } from '@pierre/diffs/react'
import { observer } from 'mobx-react-lite'

import { useGlobal } from '@/context'

import { useModel } from '../context'

const Index = () => {
	const { project_files } = useModel()

	const global = useGlobal()
	const file = $copy(project_files.select_file)!

	return (
		<div className='flex h-full w-full'>
			<Virtualizer
				className='
					overflow-y-scroll
					w-full h-full
					min-h-0 max-h-full
				'
				key={file.path}
			>
				<File
					className='flex h-full w-full flex-col'
					file={file}
					options={{
						theme: `github-${global.theme.theme_value}`,
						overflow: 'wrap',
						unsafeCSS: `
                                    [data-diffs-header='default']{
                                          position:sticky;
                                          min-height:2.16rem;
                                          border-bottom:1px solid var(--color-border-light);
                                          font-size:12px;
                                    }

                                    [data-diffs-header='default'] svg{
                                          width:12px;
                                          height:12px;
                                    }

                                    [data-line-number-content]{
                                          font-family:var(--font-mono);
                                    }

                                    pre{
                                          padding:6px 0;
                                    }
                              `
					}}
					style={{
						'--diffs-font-size': '12px',
						'--diffs-font-family': 'var(--font_family)',
						'--diffs-line-height': 1.62,
						'--diffs-tab-size': 10,
						'--diffs-fg-number': 'var(--color-std-300)'
					}}
				></File>
			</Virtualizer>
		</div>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()

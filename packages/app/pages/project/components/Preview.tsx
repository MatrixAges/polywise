import { File, Virtualizer } from '@pierre/diffs/react'
import { observer } from 'mobx-react-lite'

import { useGlobal } from '@/context'

import { useModel } from '../context'

const Index = () => {
	const { project_files } = useModel()

	const global = useGlobal()
	const file = $copy(project_files.select_file)!

	return (
		<div
			className='
				flex flex-1
				w-full h-full
				min-w-0 min-h-0
			'
		>
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
                              `
					}}
					style={{
						'--diffs-font-size': '13px',
						'--diffs-font-family': 'var(--font_family)',
						'--diffs-line-height': 1.62
					}}
				></File>
			</Virtualizer>
		</div>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()

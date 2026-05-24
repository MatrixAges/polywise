'use client'

import { AndroidLogo, CaretDoubleUp } from '@phosphor-icons/react'
import { $ } from '@website/utils'

import styles from './index.module.css'

const Index = () => {
	return (
		<div className={$.cx('small_content_wrap flex items-center justify-center', styles._local)}>
			<form className='form'>
				<h1 className='section_title'>Activate</h1>
				<div
					className='
						box-border
						flex flex-col
						w-full
						input_wrap lightcard top
					'
				>
					<label className='field flex items-center'>
						<AndroidLogo className='icon' size={16} />
						<input className='input' placeholder='Workspace key' maxLength={30} />
					</label>
					<label className='field flex items-center'>
						<CaretDoubleUp className='icon' size={16} />
						<input className='input' placeholder='Activation code' maxLength={24} />
					</label>
				</div>
				<button className='btn_submit clickable mt-1.5 w-full' type='button'>
					Mock submit
				</button>
			</form>
		</div>
	)
}

export default Index

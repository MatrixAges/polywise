'use client'

import { AndroidLogo, CaretDoubleUp } from '@phosphor-icons/react'
import { $ } from '@website/utils'
import { Button, Form, Input } from 'antd'

import styles from './index.module.css'

const { Item } = Form

const Index = () => {
	return (
		<div className={$.cx('small_content_wrap flex items-center justify-center', styles._local)}>
			<Form className='form' layout='vertical'>
				<h1 className='section_title'>Activate</h1>
				<div
					className='
						box-border
						flex flex-col
						w-full
						input_wrap lightcard top
					'
				>
					<Item name='id' noStyle>
						<Input placeholder='Workspace key' maxLength={30} prefix={<AndroidLogo />} />
					</Item>
					<Item name='activation_code' noStyle>
						<Input placeholder='Activation code' maxLength={24} prefix={<CaretDoubleUp />} />
					</Item>
				</div>
				<Button className='clickable mt-1.5 w-full' htmlType='button'>
					Mock submit
				</Button>
			</Form>
		</div>
	)
}

export default Index
